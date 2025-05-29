import { create } from "zustand";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

import { axiosInstance } from "../lib/axios.js";
import { useChatStore } from "./useChatStore.js";

const BASE_URL =
    import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isVerifying: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const response = await axiosInstance.get("/auth/check");
            if (response.data) {
                set({ authUser: response.data });
            } else {
                set({ authUser: null });
            }
        } catch (error) {
            console.error("Error checking auth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const response = await axiosInstance.post("/auth/signup", data);
            if (response.data) {
                toast.success(
                    "Signup successful. Please check your email to verify your account.",
                    {
                        id: "signup-success",
                    },
                );
                return response.data; // Trả về dữ liệu người dùng đã đăng ký
            } else {
                toast.error("Signup failed: Invalid response", {
                    id: "signup-failed",
                });
                return null; // Trả về null nếu không có dữ liệu người dùng
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error signing up", {
                id: "signup-error",
            });
            return null; // Trả về null nếu có lỗi
        } finally {
            set({ isSigningUp: false });
        }
    },

    verifyEmail: async (token) => {
        set({ isVerifying: true });
        try {
            const res = await axiosInstance.get(`/auth/verify-email/${token}`);
            return { success: true, message: res.data.message };
        } catch (error) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Email verification failed",
            };
        } finally {
            set({ isVerifying: false }); // luôn đảm bảo reset trạng thái
        }
    },

    signin: async (data) => {
        set({ isLoggingIn: true });
        try {
            const response = await axiosInstance.post("/auth/signin", data);
            if (response.data && response.data._id) {
                set({ authUser: response.data });
                toast.success("Logged in successfully!", {
                    id: "login-success",
                });
                return response.data; // Trả về dữ liệu người dùng đã đăng nhập
            } else {
                toast.error("Login failed: Invalid response", {
                    id: "login-failed",
                });
                return null; // Trả về null nếu không có dữ liệu người dùng
            }
        } catch (error) {
            set({ authUser: null }); // Đảm bảo không lưu authUser khi lỗi
            toast.error(error.response?.data?.message || "Error logging in", {
                id: "login-error",
            });
            return null; // Trả về null nếu có lỗi
        } finally {
            set({ isLoggingIn: false });
        }
    },

    signinWithGoogle: async (googleData) => {
        set({ isLoggingIn: true });
        try {
            const response = await axiosInstance.post(
                "/auth/google-signin",
                googleData,
            );

            if (response.data && response.data._id) {
                set({ authUser: response.data });
                toast.success("Logged in with Google successfully!", {
                    id: "google-login-success",
                });
                return response.data;
            } else {
                toast.error("Google login failed", {
                    id: "google-login-failed",
                });
                return null;
            }
        } catch (error) {
            set({ authUser: null });
            toast.error(
                error.response?.data?.message || "Error logging in with Google",
                {
                    id: "google-login-error",
                },
            );
            return null;
        } finally {
            set({ isLoggingIn: false });
        }
    },

    forgotPassword: async (email) => {
        try {
            const res = await axiosInstance.post("/auth/forgot-password", {
                email,
            });
            toast.success("Password reset link sent to your email", {
                id: "reset-link-sent",
            });
            return res.data;
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Error sending reset link",
                {
                    id: "send-email-error",
                },
            );
            return null;
        }
    },

    resetPassword: async (token, newPassword) => {
        try {
            const res = await axiosInstance.post(
                `/auth/reset-password/${token}`,
                { password: newPassword },
            );
            toast.success("Password reset successfully", {
                id: "reset-success",
            });
            return res.data;
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Error resetting password",
                {
                    id: "reset-password-error",
                },
            );
            return null;
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully!");
            get().disconnectSocket(true); // Ngắt kết nối socket khi đăng xuất
            useChatStore.getState().unsubcribeFromMessages();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error logging out");
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const response = await axiosInstance.put(
                "/auth/update-profile",
                data,
            );
            if (response.data && response.data._id) {
                set({ authUser: response.data });
                toast.success("Profile updated successfully!", {
                    id: "update-success",
                });
            } else {
                toast.error("Update failed: Invalid response", {
                    id: "update-failed",
                });
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Error updating profile",
                {
                    id: "update-error",
                },
            );
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) {
            return;
        }
        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
            transports: ["websocket"],
            withCredentials: true,
        });
        socket.connect();

        socket.on("connect", async () => {
            // Gọi các bước sau khi kết nối socket thành công
            const chatStore = useChatStore.getState();

            chatStore.subcribeToMessages(); // lắng nghe newMessage
            await chatStore.getUnreadMessages(); // lấy unread

            useChatStore.setState({ isChatReady: true }); // Đánh dấu đã sẵn sàng
        });

        socket.on("init", (data) => {
            if (data.onlineUsers) {
                set({ onlineUsers: data.onlineUsers });
            }
        });

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
        });

        set({ socket: socket });
    },

    disconnectSocket: (force = false) => {
        const socket = get().socket;
        if (socket?.connected) {
            socket.disconnect();

            // Chỉ xóa nếu thực sự đăng xuất hoặc thoát ứng dụng
            if (force) {
                set({ socket: null });
            }
        }
    },
}));
