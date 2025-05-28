import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d', // Thời gian hết hạn của token
    });

    res.cookie('jwt', token, {
        httpOnly: true, // Ngăn chặn truy cập từ JavaScript
        sameSite: 'strict', // Ngăn chặn CSRF
        secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong môi trường production
        maxAge: 7 * 24 * 60 * 60 * 1000, // Thời gian sống của cookie (7 ngày)
    });

    return token;
}