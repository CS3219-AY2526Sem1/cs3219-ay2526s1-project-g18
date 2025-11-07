import { client, io , persistenceManager} from '../server.js';
import { v4 } from 'uuid';

export async function createRoom(req, res) {
  try {
    const { topic, difficulty, userId1, userId2 } = req.body;
    let roomId;
    let success = false;

    while (!success) {
        roomId = `${topic}-${difficulty}-${v4()}`;
        const key = `room:${roomId}:info`;
        // create hash set with key as `room:${roomId}:info` only if it does not already exist
        const iso = new Date().toISOString();
        success = await client.hSetNX(key, 'created', iso);
    }

    // initialise room info entry in redis
    await client.hSet(`room:${roomId}:info`, {
        usernames: JSON.stringify([]),
    })
    
    console.log(`Created room ${roomId} for topic ${topic} at difficulty ${difficulty}`);

    // add persistence entry
    await persistenceManager.getOrCreateDoc(roomId);

    console.log(`Initialized persistence for room ${roomId}`);

    const socketId1 = await client.hGet(`userMaps:${userId1}`, 'socketId');
    console.log(`Fetched socket ID for user ${userId1}: ${socketId1}`);
    const socketId2 = await client.hGet(`userMaps:${userId2}`, 'socketId');
    console.log(`Fetched socket ID for user ${userId2}: ${socketId2}`);
    
    if (socketId1) {
        io.to(socketId1).emit("roomCreated", { roomId: roomId });
        console.log(`Emitted roomCreated to socket ${socketId1} for user ${userId1}`);
    }
    if (socketId2) {
        io.to(socketId2).emit("roomCreated", { roomId: roomId });
        console.log(`Emitted roomCreated to socket ${socketId2} for user ${userId2}`);
    }


    return [res.status(200).json({ message: "Success" })]

  } catch (error) {
        console.error(`[500] /create-room -> ${error?.message || "Unknown error when creating room!"}`);
        return res.status(500).json({ message: error.message || "Unknown error when creating room!" });
  }
}