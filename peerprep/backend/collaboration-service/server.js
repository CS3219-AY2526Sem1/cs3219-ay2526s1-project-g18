import http from "http";
import index from "./index.js";
import redis from "redis";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const server = http.createServer(index);
const port = process.env.PORT || 3003;

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


io.engine.on('connection', (engineSocket) => {
  console.log('engine.io connection — id:', engineSocket.id, ' remoteAddress:', engineSocket.request?.connection?.remoteAddress);
});

io.on("connection", async (socket) => {
    console.log("New client attempt to connect to Collaboration Service");
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
    
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    await client.set(`userSocket:${userId}`, socket.id);
    console.log(`Stored socket ID for user ${userId} in Redis.`);

    socket.on("disconnect", async () => {
        await client.del(`userSocket:${userId}`);
    });

    //atomic operations for joinRoom and lua script by chatgpt
    const joinScript = `
        -- KEYS[1] = infoKey (hash)
        -- KEYS[2] = usersKey (set)
        -- ARGV[1] = userJson
        -- ARGV[2] = timestamp

        -- 1. Check if room exists
        if redis.call('EXISTS', KEYS[1]) == 0 then
          return {err="ROOM_NOT_FOUND"}
        end

        -- 2. Add user to the set
        redis.call('SADD', KEYS[2], ARGV[1])

        -- 3. Get all members
        local members = redis.call('SMEMBERS', KEYS[2])

        -- 4. Determine inUse
        local inUse = 'false'
        if #members >= 2 then
          inUse = 'true'
        end

        -- 5. Write back to hash
        local usersJson = cjson.encode(members)
        redis.call('HSET', KEYS[1],
          'users', usersJson,
          'inUse', inUse,
          'updated', ARGV[2]
        )

        -- 6. Return state
        return {inUse, usersJson}
        `;
    socket.on("joinRoom", async ({ roomId, userId, username }) => {
      const infoKey = `room:${roomId}:info`
      const usersKey = `room:${roomId}:users`
      const userJson = JSON.stringify({ userId, username })
      const ts = Date.now().toString()

      try {
        // ⚙️ Run the Lua script atomically
        const res = await client.eval(joinScript, {
          keys: [infoKey, usersKey],
          arguments: [userJson, ts],
        })

        // Handle "ROOM_NOT_FOUND"
        if (res && res.err === "ROOM_NOT_FOUND") {
          console.warn(`joinRoom: no room info found for ${infoKey}`)
          return socket.emit("error", { message: "Room not found" })
        }

        // Validate result
        if (!Array.isArray(res) || res.length < 2) {
          console.error("Unexpected eval result:", res)
          return socket.emit("error", { message: "Server error joining room" })
        }

        const inUse = res[0]
        const members = JSON.parse(res[1]) // members = ['{"userId":"a"}','{"userId":"b"}']
        const usersObjs = members.map(u => JSON.parse(u))

        // ✅ Join socket and broadcast
        socket.join(roomId)
        io.to(roomId).emit("userJoined", { userId, username, users: usersObjs, inUse })

      } catch (err) {
        console.error("joinRoom eval error:", err)
        socket.emit("error", { message: "Server error joining room" })
      }
    })
    });

export default server;

