import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        // --- Thông tin cơ bản ---
        email: { 
            type: String, 
            required: true, 
            unique: true 
        },
        fullName: { 
            type: String, 
            required: true 
        },
        password: {
            type: String,
            required: function () {
                return !this.isGoogle; // Không bắt buộc nếu là tài khoản Google
            },
            minlength: 6,
        },
        profilePicture: { 
            type: String, 
            default: "" 
        },
        isGoogle: { 
            type: Boolean, 
            default: false 
        },

        // --- Xác minh tài khoản ---
        isVerified: { 
            type: Boolean, 
            default: false 
        },
        verifyToken: String,
        verifyTokenExpires: Date,

        // --- Quên mật khẩu ---
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true,
    },
);

const User = mongoose.model("User", userSchema); // Tạo model User từ schema và trong DB sẽ là users

export default User;
