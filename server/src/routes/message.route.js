import express from "express";

import {
    getUsersForSidebar,
    getMessages,
    sendMessage,
    getUnreadMessages,
    markMessagesAsRead,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/unread-messages", protectRoute, getUnreadMessages);
router.patch("/mark-read/:id", protectRoute, markMessagesAsRead);
router.post("/send/:id", protectRoute, sendMessage);
router.get("/:id", protectRoute, getMessages);

export default router;
