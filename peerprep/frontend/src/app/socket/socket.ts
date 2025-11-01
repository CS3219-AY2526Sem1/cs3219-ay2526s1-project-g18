"use client";
import io from "socket.io-client";

type ClientSocket = ReturnType<typeof io>;

let socket: ClientSocket | null = null;

export function initSocket() {
    if (typeof window === "undefined") return null; // guard for SSR

    if (socket) return socket;
    console.log("Initializing new socket connection");

    const user = sessionStorage.getItem("user");
    const parsedUser = user ? JSON.parse(user) : null;
    const token = sessionStorage.getItem("token");

    socket = io('http://localhost:3003', 
        { auth: { token }, 
        autoConnect: true,
        reconnection: true,
        //try to reconnect for up to 2 minutes
        reconnectionAttempts: 40,
        reconnectionDelay: 3000
     });

    socket.on("connect", () => {
        console.log("Connected to socket", socket?.id);
        //delay for 5 sec then console.log connected
        setTimeout(() => {
            console.log("Socket connection established for reals:", socket?.id);
        }, 5000);
    });

    socket.on("roomCreated", (data: { roomId: string }) => {
        console.log("Room created with ID:", data.roomId);
        socket?.emit("joinRoom", { roomId: data.roomId, userId: parsedUser?.id, username: parsedUser?.username });
    });

    socket.on("userJoined", (data: {userId: string, username: string}) => {
        console.log("Someone joined the room: ", data.username);
    });

    socket.on("rejoinRoom", () => {
        console.log("Rejoining the room after reconnection");
    });

    socket.on("partnerRejoined", (data: {userId: string }) => {
        console.log("your partner has rejoined the room", data.userId);
    });

    socket.on("partnerDisconnected", (data: { userId: string }) => {
        console.log("Your partner has disconnected:", data.userId);
    });

    socket.on("partnerLeft", (data: { userId: string }) => {
        console.log("Your partner has left the room:", data.userId);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from socket:", socket?.id);
    });

    return socket;
}

export function getSocket() {
    return socket;
}
