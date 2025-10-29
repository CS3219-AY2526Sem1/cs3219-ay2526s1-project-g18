"use client";
import io from "socket.io-client";

type ClientSocket = ReturnType<typeof io>;

let socket: ClientSocket | null = null;

export function initSocket() {
    if (typeof window === "undefined") return null; // guard for SSR

    if (socket) return socket;

    const user = sessionStorage.getItem("user");
    const parsedUser = user ? JSON.parse(user) : null;
    const token = sessionStorage.getItem("token");

    socket = io('http://localhost:3003', { auth: { token }, autoConnect: false });

    socket.on("connect", () => {
        console.log("Connected to socket", socket?.id);
    });

    socket.on("roomCreated", (data: { roomId: string }) => {
        console.log("Room created with ID:", data.roomId);
        socket?.emit("joinRoom", { roomId: data.roomId, userId: parsedUser?.id, username: parsedUser?.username });
    });

    socket.on("userJoined", (data: {userId: string, username: string}) => {
        console.log("Someone joined the room: ", data.username);
    });

    socket.on("retryJoin", (data: { roomId: string }) => {
        console.log("Retrying join...");
        socket?.emit("joinRoom", { roomId: data.roomId, serId: parsedUser?.id, username: parsedUser?.username });
    });

    return socket;
}

export function getSocket() {
    return socket;
}
