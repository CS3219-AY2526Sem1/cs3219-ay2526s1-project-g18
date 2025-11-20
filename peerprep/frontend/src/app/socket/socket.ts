"use client";
import io from "socket.io-client";

type ClientSocket = ReturnType<typeof io>;

let socket: ClientSocket | null = null;

export function initSocket() {
    // if (typeof window === "undefined") return null; // guard for SSR
    console.log("Initializing new socket connection");

    if (socket) return socket;

    const user = sessionStorage.getItem("user");
    const parsedUser = user ? JSON.parse(user) : null;
    const token = sessionStorage.getItem("token");

    socket = io(process.env.NEXT_PUBLIC_COLLAB_SERVICE_API_URL ?? "http://localhost:3003", 
        { auth: { token }, 
        autoConnect: true,
        reconnection: true,
        //try to reconnect for up to 2 minutes
        reconnectionAttempts: 40,
        reconnectionDelay: 3000
     });

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

    socket.on("partnerFinished", (data: { roomId: string }) => {
        console.log("Your partner has finished the session and left the room:", data.roomId);
    });

    socket.on('5MinLeft', () => {
        console.log("5 minutes left in the session");
    });

    socket.on('1MinLeft', () => {
        console.log("1 minute left in the session");
    }); 

    socket.on('timeUp', () => {
        console.log("Time is up for the session");
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from socket:", socket?.id);
    });

    return socket;
}

export function getSocket() {
    return socket;
}
