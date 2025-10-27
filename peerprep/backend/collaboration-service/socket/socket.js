import { io } from "../server.js";
import jwt from "jsonwebtoken";
import { client as redis } from "../server.js";

io.on("connection", async (socket) => {
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
    
    await redis.set(`userSocket:${userId}`, socket.id);

    socket.on("disconnect", async () => {
        await redis.del(`userSocket:${userId}`);
    });

    socket.on("joinRoom", async ({ roomId, userId, username }) => {
        const roomInfo = await redis.get(`room:${roomId}:info`);
        if (roomInfo) {
            const roomData = JSON.parse(roomInfo);
            const users = JSON.parse(roomData.users);
            if (roomData.inUse === 'true' || users.length >= 2) {
                await fetch('http://localhost:3003/create-alt-room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId: roomId, userId: userId }),
                });
            } else {
                if (users.length === 1) {
                    roomData.inUse = 'true';
                }
                users.push({ userId: userId, username: username });
                roomData.users = JSON.stringify(users);
                await redis.hSet(`room:${roomId}:info`, roomData);
                socket.join(roomId);
                io.to(roomId).emit("userJoined", { userId: userId, username: username });
            }
        }
    });


})