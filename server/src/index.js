import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import fs from "fs";

import authRoutes from "./routes/auth.route.js";
import messagesRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

const allowedOrigin = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.replace(/\/$/, "")
    : "http://localhost:5173";

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
    }),
);

app.get("/", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running successfully!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messagesRoutes);

const clientDistPath = path.join(__dirname, "../client/dist");
if (
    process.env.NODE_ENV === "production" &&
    fs.existsSync(path.join(clientDistPath, "index.html"))
) {
    app.use(express.static(clientDistPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(clientDistPath, "index.html"));
    });
}

server.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
    connectDB();
});
