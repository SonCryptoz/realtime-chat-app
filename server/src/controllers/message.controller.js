import mongoose from "mongoose";

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id; // Lấy id của người dùng đã đăng nhập từ req.user
        const filteredUsers = await User.find({
            _id: { $ne: loggedInUserId }, // Lọc bỏ người dùng đã đăng nhập
        })
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo
            .select("-password"); // Chọn tất cả các trường trừ password

        res.status(200).json(filteredUsers); // Trả về danh sách người dùng đã lọc
    } catch (error) {
        console.error("Error fetching users for sidebar:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const { beforeMessageId } = req.query; // Lấy từ query params
        const myId = req.user._id;

        const PAGE_SIZE = 20; // Số tin nhắn mỗi lần load

        const baseQuery = {
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        };

        // Nếu có beforeMessageId, chỉ lấy các tin nhắn cũ hơn
        if (beforeMessageId) {
            const beforeMessage = await Message.findById(beforeMessageId);
            if (beforeMessage) {
                baseQuery.createdAt = { $lt: beforeMessage.createdAt };
            }
        }

        const messages = await Message.find(baseQuery)
            .sort({ createdAt: -1 }) // Sắp xếp mới nhất -> cũ nhất để phân trang dễ hơn
            .limit(PAGE_SIZE)
            .populate("senderId", "-password")
            .populate("receiverId", "-password");

        // Đảo ngược lại cho đúng thứ tự hiển thị (cũ -> mới)
        const orderedMessages = messages.reverse();

        res.status(200).json(orderedMessages);
    } catch (error) {
        console.error("Error fetching messages:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body; // Lấy text và image từ body
        const { id: receiverId } = req.params; // Lấy id người nhận từ params
        const senderId = req.user._id; // Lấy id người gửi từ req.user

        // Kiểm tra receiverId có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: "Invalid receiver ID" });
        }

        // Ít nhất phải có text hoặc ảnh
        if (!text && !image) {
            return res
                .status(400)
                .json({ message: "Message must contain text or image" });
        }

        // Nếu có ảnh được gửi kèm tin nhắn, tải ảnh lên Cloudinary và lưu lại URL ảnh
        let imageUrl = null;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image); // Tải ảnh lên Cloudinary
            imageUrl = uploadResponse.secure_url; // Lưu URL của ảnh đã tải lên
        }

        // Tạo một tin nhắn mới
        const newMessage = new Message({
            senderId,
            receiverId,
            text: text?.trim(),
            image: imageUrl,
        });

        await newMessage.save(); // Lưu tin nhắn vào cơ sở dữ liệu

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "-password")
            .populate("receiverId", "-password");

        // Real time funtionality goes here => socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(populatedMessage || newMessage); // Trả về tin nhắn mới tạo
    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUnreadMessages = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const unread = await Message.aggregate([
            {
                $match: {
                    receiverId: currentUserId,
                    isRead: false,
                },
            },
            {
                $group: {
                    _id: "$senderId",
                    unreadCount: { $sum: 1 },
                },
            },
        ]);

        // Convert to map: { userId, unreadCount }
        const result = unread.map((item) => ({
            userId: item._id,
            unreadCount: item.unreadCount,
        }));

        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Failed to fetch unread messages" });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const senderId = req.params.id;

        await Message.updateMany(
            {
                senderId,
                receiverId: currentUserId,
                isRead: false,
            },
            { isRead: true },
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Failed to mark messages as read" });
    }
};
