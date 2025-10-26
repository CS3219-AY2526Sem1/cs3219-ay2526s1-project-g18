const user = sessionStorage.getItem("user");
const parsedUser = user ? JSON.parse(user) : null;
const token = sessionStorage.getItem("token");

const socket = io('http://localhost:3003', {auth: { token: token }, autoConnect: false});
socket.on("connect", () => { 
    console.log("Connected to socket", socket.id); 
});

socket.on("roomCreated", (data: { roomId: string }) => {
    socket.emit("joinRoom", { roomId: data.roomId, userId: parsedUser?.id, username: parsedUser?.username });
});
