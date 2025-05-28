import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected:", connect.connection.host, connect.connection.name);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
