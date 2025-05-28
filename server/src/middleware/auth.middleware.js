import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    const token = req.cookies.jwt;

    // Kiểm tra xem token có tồn tại không
    if (!token) {
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });  
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Kiểm tra xem token có hợp lệ không
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        // Tìm người dùng từ token
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Unauthorized - User Not Found" });
        }

        // Gán thông tin người dùng vào req.user
        req.user = user;

        // Tiếp tục xử lý tiếp theo
        next();
    } catch (error) {
        console.error("Error during token verification:", error);
        return res.status(500).json({ message: "Unauthorized - Token Verification Failed" });
    }
};