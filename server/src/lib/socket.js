import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [process.env.CLIENT_URL],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Dùng Set để hỗ trợ nhiều socketId cho 1 userId
const userSocketMap = {}; // { userId: Set(socketIds) }

export function getReceiverSocketId(userId) {
    const sockets = userSocketMap[userId];
    // Trả về socket đầu tiên (hoặc bất kỳ)
    return sockets ? Array.from(sockets)[0] : null;
}

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;

    if (userId) {
        if (!userSocketMap[userId]) {
            userSocketMap[userId] = new Set();
        }
        userSocketMap[userId].add(socket.id);
    }

    // Gửi lại danh sách người dùng online cho tất cả
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Gửi init info riêng cho client vừa kết nối (nếu muốn)
    socket.emit("init", {
        onlineUsers: Object.keys(userSocketMap),
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);

        if (userId && userSocketMap[userId]) {
            userSocketMap[userId].delete(socket.id);

            if (userSocketMap[userId].size === 0) {
                delete userSocketMap[userId];
            }
        }

        // Cập nhật lại danh sách online
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server };
