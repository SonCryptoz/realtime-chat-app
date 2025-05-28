import express from "express";
import {
    signup,
    signin,
    signinWithGoogle,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
    updateProfile,
    checkAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google-signin", signinWithGoogle);

router.get("/verify-email/:token", verifyEmail);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
