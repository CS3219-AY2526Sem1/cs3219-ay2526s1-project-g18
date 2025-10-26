import { Server } from "socket.io";
import server from "../server.ts";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { client as redis } from "../server.ts";

export const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", async (socket) => {
    const token = socket.handshake.auth?.token;
    const jwtSecret = process.env.JWT_SECRET;
    if (!token || !jwtSecret) {
        console.error("Authentication failed: Missing token or JWT secret.");
        socket.disconnect();
        return;
    }
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    const userId = decoded.id;
    if (!userId) {
        console.error("Authentication failed: Invalid token.");
        socket.disconnect();
        return;
    }
    
    await redis.set(`userSocket:${userId}`, socket.id);

    socket.on("disconnect", async () => {
        await redis.del(`userSocket:${userId}`);
    });

    socket.on("joinRoom", async (data: { roomId: string, userId: string, username: string }) => {
        const roomInfo = await redis.get(`room:${data.roomId}:info`);
        if (roomInfo) {
            const roomData = JSON.parse(roomInfo);
            const users = JSON.parse(roomData.users);
            if (roomData.inUse === 'true' || users.length >= 2) {
                await fetch('http://localhost:3003/create-alt-room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId: data.roomId, userId: data.userId }),
                });
            } else {
                if (users.length === 1) {
                    roomData.inUse = 'true';
                }
                users.push({ userId: data.userId, username: data.username });
                roomData.users = JSON.stringify(users);
                await redis.hSet(`room:${data.roomId}:info`, roomData);
                socket.join(data.roomId);
                io.to(data.roomId).emit("userJoined", { userId: data.userId, username: data.username });
            }
        }
    });


})