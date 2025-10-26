import { client } from '../server';
import { v4 } from 'uuid';
import { io } from '../socket/socket.ts';

export async function createRoom(req, res) {
  try {
    const { topic, difficulty, userId1, userId2 } = req.body;
    const roomId = `${topic}-${difficulty}-${v4()}`

    await client.hSet(`room:${roomId}:info`, {
        created: Date.now(),
        updated: Date.now(),
        inUse: 'false',
        users: JSON.stringify([])
    })

    const socketId1 = await client.get(`userSocket:${userId1}`);
    const socketId2 = await client.get(`userSocket:${userId2}`);
    
    if (socketId1) {
        io.to(socketId1).emit("roomCreated", { roomId: roomId });
    }
    if (socketId2) {
        io.to(socketId2).emit("roomCreated", { roomId: roomId });
    }

    return res.status(200); 

  } catch (error) {
        console.error(`[500] /create-room -> ${error?.message || "Unknown error when creating room!"}`);
        return res.status(500).json({ message: error.message || "Unknown error when creating room!" });
  }
}

// This is called if a user is allocated to a duplicate room that has already been filled. 
// An alternative room is deterministically created so the remaining unallocated users are redirected to the same room.
export async function createAltRoom(req, res) {
    try {
        const { roomId, userId }  = req.body;
        const altRoomId = roomId + 1;

        await client.hSet(`room:${altRoomId}:info`, {
            created: Date.now(),
            updated: Date.now(),
            inUse: 'false',
            users: JSON.stringify([])
        })

        const socketId = await client.get(`userSocket:${userId}`);
        if (socketId) {
            io.to(socketId).emit("roomCreated", { roomId: roomId });
        }
    } catch (error) {
        console.error(`[500] /create-alt-room -> ${error?.message || "Unknown error when creating alternative room!"}`);
        return res.status(500).json({ message: error.message || "Unknown error when creating alternative room!" });
    }
}