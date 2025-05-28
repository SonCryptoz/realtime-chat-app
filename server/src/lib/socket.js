import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [process.env.CLIENT_URL],
        credentials: true,
    },
});

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// Được sử dụng để lưu trữ người dùng trực tuyến
const userSocketMap = {}; // { userId: socketId}

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query?.userId;

    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    //  Được sử dụng để gửi sự kiện đến tất cả các máy khách được kết nối
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);

        if (userId && userSocketMap[userId]) {
            delete userSocketMap[userId];
        }
        
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server };
