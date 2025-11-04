import http from "http";
import index from "./index.js";
import redis from "redis";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import PersistenceManager from './persistence/persistenceManager.js';

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

// create persistence manager with 1 second repersist to redis interval
export const persistenceManager = new PersistenceManager(client, { persistIntervalMs: 1000 });
// preload existing rooms from redis (if any)
persistenceManager.restoreAllRooms()

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
    
    // ROOM CONNECTION LOGIC
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    socket.userId = userId; // store userId in socket for later use
    // if a userId -> socketId mapping is already in the redis, it means user is reconnecting
    const userMapExists = await client.exists(`userMaps:${userId}`);
    if (userMapExists) {
      // update the mapping with new socket id
        await client.hSet(`userMaps:${userId}`, { socketId: socket.id });

      // ROOM RECONNECTION LOGIC
      // check if they were in a room before disconnection. if so, emit rejoinRoom event
        const roomId = await client.hGet(`userMaps:${userId}`, "roomId");
        if (roomId) {// successful reconnection to previous room
            console.log(`User ${userId} rejoining room ${roomId}`);
            // add userId back to room's user set
            await client.sAdd(`room:${roomId}:users`, userId)
            // cancel any 2 min redis TTL on empty room so it doesnt get deleted if a user rejoins
            await client.persist(`room:${roomId}:users`) 
            await client.persist(`room:${roomId}:info`) 
            await client.persist(`room:${roomId}:data`)
            socket.join(roomId);

            // Restore Yjs document and awareness state for the room
            const { doc, awareness } = await persistenceManager.getOrCreateDoc(roomId);
            const encodedDoc = Y.encodeStateAsUpdate(doc);
            const encodedAwareness = awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()));
            socket.emit('yJsSync', encodedDoc);
            socket.emit('awarenessSync', encodedAwareness);

            // notify partner that user has rejoined
            socket.to(roomId).emit("partnerRejoined", { userId });
            // emit rejoinRoom to user itself
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
      io.to(roomId).emit("partnerFinished", { roomId });
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
            // in order to avoid overwriting 'solved' or 'time_ended' status we must use the hSetNX command
            await client.hSetNX(`room:${roomId}:info`, 'status', 'disconnected');
             
            // STORE ROOM INFO TO ATTEMPT HISTORY W USERID -> ensures premature disconnection and incomplete code is only reflected for this user 
            try {
              await persistenceManager.handleClientLeftRoom(roomId, userId);
            } catch (e) {
              console.error('handleClientLeftRoom error during immediate closeRoom flow', e);
            }
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

          // First clear our persistent storage
          
          console.log(`Room ${roomId} is now empty. Setting TTL for room data.`);
          await client.expire(`room:${roomId}:users`, timerDuration + 30)
          await client.expire(`room:${roomId}:info`, timerDuration + 30)
          await client.expire(`room:${roomId}:data`, timerDuration + 30)
          setTimeout(async () => {
            const usersTTL = await client.ttl(`room:${roomId}:users`);
            const infoTTL = await client.ttl(`room:${roomId}:info`);
            const dataTTL = await client.ttl(`room:${roomId}:data`);
            if (usersTTL === -2 && infoTTL === -2 && dataTTL === -2) { // means the room has been deleted
              disconnectTimers.delete(roomId); // cleanup any existing timers on the room
              console.log(`Deleted room ${roomId} as no one rejoined`);
            }
          }, (timerDuration + 30) * 1000); // INCREASED BUFFER TIME TO 50s
        }

      } else {
        await client.del(`userMaps:${userId}`);
      }
    });

    // ROOM JOINING LOGIC
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

      try {
        // Run the Lua script atomically
        const res = await client.eval(joinScript, {
          keys: [infoKey, usersKey],
          arguments: [userId, username],
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
        socket.roomId = roomId; // store roomId in socket for later use

        await client.hSet(`userMaps:${userId}`, { roomId: roomId })
        io.to(roomId).emit("userJoined", { userId, username })

        // Retrieve or create Yjs document and awareness state
        const entry = await persistenceManager.getOrCreateDoc(roomId);
        const doc = entry.doc;
        const awareness = entry.awareness;

        // This will basically encode the DIFF between an empty Yjs doc and the current state
        const encodedDoc = Y.encodeStateAsUpdate(doc);
        // same for awareness
        const encodedAwareness = awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()));

        // CLIENT: listen to these ON CONNECT to set up doc and awareness on frontend when socket first connects
        // client will need to apply these using Y.applyUpdate and awareness.applyUpdate respectively
        socket.emit('yJsSync', encodedDoc);
        socket.emit('awarenessSync', encodedAwareness);

        const usersCount = await client.sCard(usersKey);
        const usernames = await client.hGet(infoKey, 'usernames');
        const username1 = JSON.parse(usernames)[0];
        const username2 = JSON.parse(usernames)[1];
        if (usersCount === 2) {
          io.to(roomId).emit("sessionStart", { roomId, username1, username2 });

          // set up timers for 5 min left, 1 min left, time up
          const timer1 = setTimeout(async () => {
            io.to(roomId).emit("5MinLeft");
            disconnectTimers.delete(roomId);
            const timer2 = setTimeout(async () => {
              io.to(roomId).emit("1MinLeft");
              disconnectTimers.delete(roomId);
              const timer3 = setTimeout(async () => {
                io.to(roomId).emit("timeUp");
                await client.hSet(`room:${roomId}:info`, 'status', 'time_ended'); 
                socket.intentionalDisconnect = true;
                socket.disconnect();
                disconnectTimers.delete(roomId);
              }, 60 * 1000);
              disconnectTimers.set(roomId, timer3);
            }, 4 * 60 * 1000);
            disconnectTimers.set(roomId, timer2);
          }, 15 * 60 * 1000);
          disconnectTimers.set(roomId, timer1);
        } 
        
      } catch (err) {
        console.error("joinRoom eval error:", err)
        socket.emit("error", { message: "Server error joining room" })
      }
    });

    // Update backend Yjs doc and awareness CRDT on client updates
    socket.on("yjsUpdate", async (update) => {
         try {
              const roomId = socket.roomId;
              if (!roomId) return;
              const entry = await persistenceManager.getOrCreateDoc(roomId);
              // asked chatgpt how to make sure update is passed as correct type for Y.applyUpdate
              const updateInUint8 = (update instanceof Uint8Array) ? update : new Uint8Array(Buffer.from(update));
              Y.applyUpdate(entry.doc, updateInUint8);
              // broadcast to peers
              socket.to(roomId).emit('yjsUpdate', update);
              persistenceManager.persistNow(roomId).catch(console.error);
            } catch (err) {
              console.error('Error handling yjsUpdate:', err);
           } 
      });
    socket.on('awarenessUpdate', async (update) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;
        await persistenceManager.applyAwarenessUpdate(roomId, update);
        // broadcast to peers
        socket.to(roomId).emit('awarenessUpdate', update);
      } catch (err) {
        console.error('Error handling awareness-update:', err);
      }
    });

  });

export default server;

