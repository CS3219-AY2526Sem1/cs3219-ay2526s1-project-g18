import http from "http";
import index from "./index.js";
import redis from "redis";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const server = http.createServer(index);
const port = process.env.PORT || 3003;
const disconnectTimers = new Map();

// Determine Redis URI based on environment
let redisUri =
  process.env.ENV === "PROD"
    ? process.env.REDIS_CLOUD_URI
    : process.env.REDIS_LOCAL_URI
export const client = redis.createClient({ url: redisUri });

async function connectRedis() {
  try {
    await client.connect();
    console.log("Collaboration service connected to Redis!");
  } catch (err) {
    console.error("Error connecting collaboration service to Redis:", err);
    process.exit(1);
  }
}

await connectRedis();

server.listen(port);
console.log("Collaboration service server listening on http://localhost:" + port);

export const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", async (socket) => {
    console.log("New client attempt to connect to Collaboration Service");
    // Authenticate user using JWT
    const token = socket.handshake.auth?.token;
    const jwtSecret = process.env.JWT_SECRET;
    if (!token || !jwtSecret) {
        console.error("Authentication failed: Missing token or JWT secret.");
        socket.disconnect();
        return;
    }
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;
    if (!userId) {
        console.error("Authentication failed: Invalid token.");
        socket.disconnect();
        return;
    }

    // Timer code by ChatGPT
    // clear any existing 2 min disconnect timer for this user
    if (disconnectTimers.has(userId)) {
      clearTimeout(disconnectTimers.get(userId));
      disconnectTimers.delete(userId);
    }

    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    socket.userId = userId;
    // if a userId -> socketId mapping is already in the redis, it means user is reconnecting
    const userMapExists = await client.exists(`userMaps:${userId}`);
    if (userMapExists) {
      // update the mapping with new socket id
        await client.hSet(`userMaps:${userId}`, { socketId: socket.id });
      // check if they were in a room before disconnection. if so, emit rejoinRoom event
        const roomId = await client.hGet(`userMaps:${userId}`, "roomId");
        if (roomId) {
            console.log(`User ${userId} rejoining room ${roomId}`);
            // add userId back to room's user set
            await client.sAdd(`room:${roomId}:users`, userId)
            // cancel any 2 min TTL on empty room so it doesnt get deleted if a user rejoins
            await client.persist(`room:${roomId}:users`) 
            await client.persist(`room:${roomId}:info`) 
            socket.join(roomId);
            // notify partner that user has rejoined
            socket.to(roomId).emit("partnerRejoined", { userId });
            socket.emit("rejoinRoom", { roomId: roomId, userId: userId });
        }
    } else {
    // if new connection, create userId -> socketId mapping
      await client.hSet(`userMaps:${userId}`, { 
        socketId: socket.id
      });
      console.log(`Stored socket ID for user ${userId} in Redis.`);
    }

    socket.on("finishSession", async ({ roomId }) => {
      await client.hSet(`room:${roomId}:info`, 'status', 'solved'); 
      socket.intentionalDisconnect = true;
      socket.disconnect();
    });

    socket.on("disconnect", async ( reason ) => {
      // if the user was in a room, notify partner of disconnect and set 2 min timers
      const userId = socket.userId;
      const roomId = await client.hGet(`userMaps:${userId}`, "roomId");

      let timerDuration;
      if (roomId) {
        if ( socket.intentionalDisconnect || reason === "client namespace disconnect" || reason === "server namespace disconnect" ) { // if purposeful disconnect
          timerDuration = 0;
        } else {
          timerDuration = 2 * 60 * 1000;
          socket.to(roomId).emit("partnerDisconnected", { userId });
        }
        // remove userId from room's user set
        await client.sRem(`room:${roomId}:users`, userId);

        // timer to delete userId from redis done by ChatGPT
        // if user does not reconnect in given time, delete their userMap (i.e. userId -> socketId, roomId mapping) and notify partner that they have left permanently
        const timer = setTimeout(async () => {
          try {
            await client.del(`userMaps:${userId}`);
            console.log(`Deleted userMaps:${userId}`);
            // if the room doesnt have a status yet, set it to disconnected. otherwise it means session was finished properly
            await client.hSetNX(`room:${roomId}:info`, 'status', 'disconnected');
            // STORE ROOM INFO TO MONGO BASED ON USERID -> ensures premature disconnection and incomplete code is only reflected for this user
            socket.to(roomId).emit("partnerLeft", { userId });
          } catch (err) {
            console.error(err);
          }
          disconnectTimers.delete(userId); // cleanup timer
        }, timerDuration);

        disconnectTimers.set(userId, timer); // store the timer so it can be cleared if user reconnects

        // if the room is now empty, set redis TTL to delete room given time (extra buffer to give time to store into mongo after user leaves permanently)
        const userCount = await client.sCard(`room:${roomId}:users`);
        if (userCount === 0) {
          await client.expire(`room:${roomId}:users`, timerDuration + 30)
          await client.expire(`room:${roomId}:info`, timerDuration + 30)
          console.log(`Deleted room ${roomId} as no one rejoined`);
        }

      } else {
        await client.del(`userMaps:${userId}`);
      }
    });

    //atomic operations for joinRoom and lua script by chatgpt
    const joinScript = `
        -- KEYS[1] = infoKey (hash)
        -- KEYS[2] = usersKey (set)
        -- ARGV[1] = userId
        -- ARGV[2] = username

        -- 1. Check if room exists
        if redis.call('EXISTS', KEYS[1]) == 0 then
          return {err="ROOM_NOT_FOUND"}
        end

        -- 2) Check current count to enforce max 2 users
        local count = redis.call('SCARD', KEYS[2])
        if count >= 2 then
          return {err="ROOM_FULL"}
        end

        -- 3. Add userId and usernames to the sets
        redis.call('SADD', KEYS[2], ARGV[1])

        -- 4. Update usernames list
          local usernamesJson = redis.call('HGET', KEYS[1], 'usernames') or "[]"
          local usernames = cjson.decode(usernamesJson)
          table.insert(usernames, ARGV[2])

        -- 5. Write back to hash
        redis.call('HSET', KEYS[1], 'usernames', cjson.encode(usernames))

        return
        `;
    socket.on("joinRoom", async ({ roomId, userId, username }) => {
      const infoKey = `room:${roomId}:info`
      const usersKey = `room:${roomId}:users`
      const ts = Date.now().toString()

      try {
        // Run the Lua script atomically
        const res = await client.eval(joinScript, {
          keys: [infoKey, usersKey],
          arguments: [userId, username, ts],
        })

        // Handle "ROOM_NOT_FOUND"
        if (res && res.err === "ROOM_NOT_FOUND") {
          console.warn(`joinRoom: no room info found for ${infoKey}`)
          return socket.emit("error", { message: "Room not found" })
        }

        // Handle "ROOM_FULL"
        if (res && res.err === "ROOM_FULL") {
          console.warn(`joinRoom: room full for ${roomId}`)
          return socket.emit("roomFull", { message: "Room is full" })
        }

        // Join socket and broadcast
        socket.join(roomId)
        await client.hSet(`userMaps:${userId}`, { roomId: roomId })
        io.to(roomId).emit("userJoined", { userId, username })

        const usersCount = await client.sCard(usersKey);
        const usernames = await client.hGet(infoKey, 'usernames');
        const username1 = JSON.parse(usernames)[0];
        const username2 = JSON.parse(usernames)[1];
        if (usersCount === 2) {
          io.to(roomId).emit("sessionStart", { roomId, username1, username2 });
        } 
        
      } catch (err) {
        console.error("joinRoom eval error:", err)
        socket.emit("error", { message: "Server error joining room" })
      }
    });
  });

export default server;

