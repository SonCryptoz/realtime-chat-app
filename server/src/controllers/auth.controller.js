import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import crypto from "crypto";

import User from "../models/user.model.js";
import sendEmail from "../lib/sendEmail.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

// Hàm gửi email xác thực
const sendVerificationEmail = async (user, req) => {
    // Tạo token xác thực email
    const verificationToken = crypto.randomUUID();
    const hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    user.verifyToken = hashedToken;
    user.verifyTokenExpires = Date.now() + 1000 * 60 * 30; // 30 phút

    await user.save(); // Lưu người dùng và token vào DB

    // Gửi email xác thực
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    const message = `
        <h2>Welcome ${user.fullName},</h2>
        <p>Thank you for signing up. Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
        <p>This link will expires in 30 minutes.</p>
    `;

    await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: message,
    });
};

export const signup = async (req, res) => {
    let { email, fullName, password } = req.body;
    try {
        // Trim và chuẩn hóa đầu vào
        if (
            typeof email !== "string" ||
            typeof fullName !== "string" ||
            typeof password !== "string"
        ) {
            return res
                .status(400)
                .json({ message: "Invalid input data types" });
        }

        email = email.trim().toLowerCase();
        fullName = fullName.trim();
        password = password.trim();

        // Kiểm tra rỗng
        if (!email || !fullName || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Validate domain email nếu cần (chặn email rác)
        const blacklistedDomains = ["tempmail.com", "mailinator.com"];
        const emailDomain = email.split("@")[1];
        if (blacklistedDomains.includes(emailDomain)) {
            return res
                .status(400)
                .json({ message: "Email domain is not allowed" });
        }

        // Kiểm tra độ dài và ký tự fullName
        if (fullName.length < 2 || fullName.length > 50) {
            return res.status(400).json({
                message: "Full name must be between 2 and 50 characters",
            });
        }
        const invalidNameChars = /[<>\/\\]/;
        if (invalidNameChars.test(fullName)) {
            return res
                .status(400)
                .json({ message: "Full name contains invalid characters" });
        }

        // Kiểm tra độ dài và độ mạnh mật khẩu
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
            });
        }

        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
        if (!strongPasswordRegex.test(password)) {
            return res.status(400).json({
                message:
                    "Password must include uppercase, lowercase, number and special character",
            });
        }

        // Kiểm tra nếu email đã tồn tại (dù đã xác thực hay chưa)
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if (existingUser.isVerified) {
                return res
                    .status(400)
                    .json({ message: "Email already exists" });
            } else {
                // Cập nhật lại thông tin nếu user chưa xác thực
                existingUser.fullName = fullName;
                existingUser.password = await bcrypt.hash(password, 10);

                await sendVerificationEmail(existingUser, req);

                return res.status(200).json({
                    message: "Email not verified. Verification email resent.",
                });
            }
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới
        const newUser = new User({
            email,
            fullName,
            password: hashedPassword,
        });

        if (newUser) {
            await sendVerificationEmail(newUser, req);

            // Trả về phản hồi (chưa login)
            return res.status(201).json({
                message:
                    "Signup successful. Please check your email to verify your account.",
            });
        } else {
            res.status(500).json({ message: "Failed to create user" });
        }
    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        // Giải mã token
        const decodedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Tìm người dùng với token đã giải mã
        const user = await User.findOne({
            verifyToken: decodedToken,
            verifyTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired email verification token",
            });
        }

        // Kiểm tra xem email đã được xác thực chưa
        if (user.isVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        // Cập nhật trạng thái xác thực email
        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error during email verification:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const signin = async (req, res) => {
    let { email, password } = req.body;
    try {
        // Trim và chuẩn hóa đầu vào
        if (typeof email !== "string" || typeof password !== "string") {
            return res
                .status(400)
                .json({ message: "Invalid input data types" });
        }

        email = email.trim().toLowerCase();
        password = password.trim();

        // Kiểm tra rỗng
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Tìm người dùng
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Kiểm tra trạng thái xác thực email và không phải Google
        if (!user.isGoogle && !user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before signing in.",
            });
        }

        // Tạo JWT và gán vào cookie
        generateToken(user._id, res);
        // Trả về dữ liệu
        res.status(200).json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            profilePicture: user.profilePicture || null,
        });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signinWithGoogle = async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res
            .status(400)
            .json({ message: "Missing Google authorization code" });
    }

    try {
        // Đổi code lấy access_token + id_token
        const tokenRes = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: "postmessage",
                grant_type: "authorization_code",
            },
        );

        const { id_token } = tokenRes.data;

        if (!id_token) {
            return res
                .status(400)
                .json({ message: "No id_token received from Google" });
        }

        // Xác minh id_token
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        if (!email || !name) {
            return res
                .status(400)
                .json({ message: "Invalid Google user data" });
        }

        // Tìm hoặc tạo user
        let user = await User.findOne({ email });

        if (!user) {
            let uploadedAvatarURL = null;
            try {
                const uploadedAvatar = await cloudinary.uploader.upload(
                    picture,
                );
                uploadedAvatarURL = uploadedAvatar.secure_url;
            } catch (err) {
                console.error("Upload avatar to Cloudinary failed:", err);
            }

            user = await User.create({
                email,
                fullName: name,
                password: crypto.randomUUID(),
                profilePicture: uploadedAvatarURL || picture,
                isGoogle: true,
                isVerified: true,
            });
        }

        generateToken(user._id, res);

        return res.status(200).json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            profilePicture: user.profilePicture || null,
        });
    } catch (error) {
        console.error("Google login failed:", error.message);
        return res.status(500).json({ message: "Google login failed" });
    }
};

export const forgotPassword = async (req, res) => {
    let { email } = req.body;

    // Trim và chuẩn hóa đầu vào
    if (typeof email !== "string") {
        return res.status(400).json({ message: "Invalid input data types" });
    }

    email = email.trim().toLowerCase();

    // Kiểm tra rỗng
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isGoogle) {
            return res.status(400).json({
                message:
                    "You have already logged this Google account - Sign in to access",
            });
        }

        const resetToken = crypto.randomUUID();
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 1000 * 60 * 30; // 30 phút

        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const message = `
            <h2>Hello ${user.fullName},</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expires in 30 minutes.</p>
        `;

        await sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            html: message,
        });

        return res.status(200).json({
            message: "Reset link sent successfully. Please check your email.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error sending reset email" });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Trim và chuẩn hóa đầu vào
    if (typeof password !== "string") {
        return res.status(400).json({ message: "Invalid input data types" });
    }

    // Kiểm tra rỗng
    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }

    // Kiểm tra độ dài và độ mạnh mật khẩu
    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long",
        });
    }

    const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({
            message:
                "Password must include uppercase, lowercase, number and special character",
        });
    }

    try {
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired password reset token",
            });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Error during password reset:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfile = async (req, res) => {
    const { profilePicture } = req.body;
    const userId = req.user._id; // Lấy ID người dùng từ token đã xác thực

    try {
        // Kiểm tra rỗng
        if (!profilePicture) {
            return res
                .status(400)
                .json({ message: "Profile picture is required!" });
        }

        // Kiểm tra định dạng đầu vào
        if (typeof profilePicture !== "string" || !profilePicture.trim()) {
            return res
                .status(400)
                .json({ message: "Invalid profile picture data" });
        }

        // Tìm người dùng
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Upload ảnh lên Cloudinary và cập nhật URL vào hồ sơ người dùng
        const uploadResponse = await cloudinary.uploader.upload(profilePicture);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                profilePicture: uploadResponse.secure_url,
            },
            { new: true },
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error during profile update:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.error("Error during auth check:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
