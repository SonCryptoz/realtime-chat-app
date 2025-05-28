import { create } from "zustand";
import toast from "react-hot-toast";

import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

let isSubscribed = false;

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUserLoading: false,
    isMessageLoading: false,
    isFetchingMoreMessages: false,
    hasMoreMessages: true,
    firstUnreadMessageId: null,
    unreadMessages: {},

    getUsers: async () => {
        set({ isUserLoading: true });
        try {
            const response = await axiosInstance.get("messages/users");
            if (response.data && response.data.length > 0) {
                set({ users: response.data });
                return response.data; // Trả về danh sách người dùng
            } else {
                set({ users: [] }); // Đặt người dùng thành mảng rỗng nếu không có người dùng
                return []; // Trả về mảng rỗng nếu không có người dùng
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to fetch users",
                {
                    id: "fetch-users-error",
                },
            );
            return []; // Trả về mảng rỗng nếu có lỗi
        } finally {
            set({ isUserLoading: false });
        }
    },

    getMessages: async (userId, options = {}) => {
        const { beforeMessageId, limit = 20 } = options;
        const { messages } = get();

        const isInitial = !beforeMessageId;

        if (isInitial) {
            set({ isMessageLoading: true });
        } else {
            set({ isFetchingMoreMessages: true });
        }
        
        try {
            const url = beforeMessageId
                ? `/messages/${userId}?beforeMessageId=${beforeMessageId}&limit=${limit}`
                : `/messages/${userId}?limit=${limit}`;

            const response = await axiosInstance.get(url);

            const newMessages = response.data || [];

            if (newMessages.length === 0) {
                set({ hasMoreMessages: false });
            }

            if (isInitial) {
                set({ messages: newMessages });
            } else {
                // Ghép tin nhắn mới vào đầu danh sách hiện có
                set({ messages: [...newMessages, ...messages] });
            }

            return newMessages;
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to fetch messages",
                {
                    id: "fetch-messages-error",
                },
            );
            return []; // Trả về mảng rỗng nếu có lỗi
        } finally {
            if (isInitial) {
                set({ isMessageLoading: false });
            } else {
                set({ isFetchingMoreMessages: false });
            }
        }
    },

    sendMessage: async (data) => {
        const { selectedUser, messages } = get();
        try {
            const response = await axiosInstance.post(
                `/messages/send/${selectedUser._id}`,
                data,
            );
            if (response.data && response.data._id) {
                set({ messages: [...messages, response.data] });
                return response.data; // Trả về tin nhắn đã gửi
            } else {
                toast.error("Failed to send message", {
                    id: "send-message-error",
                });
                return null; // Trả về null nếu không gửi được tin nhắn
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to send message",
                {
                    id: "send-message-error",
                },
            );
            return null; // Trả về null nếu có lỗi
        }
    },

    subcribeToMessages: () => {
        const socket = useAuthStore.getState().socket;

        if (!socket || isSubscribed) return;

        socket.on("newMessage", (newMessage) => {
            const { messages, unreadMessages, selectedUser } = get();

            if (!selectedUser || newMessage.senderId !== selectedUser._id) {
                const count = unreadMessages[newMessage.senderId] || 0;
                // Nếu lần đầu có tin chưa đọc → lưu ID lại
                if (count === 0) {
                    set({ firstUnreadMessageId: newMessage._id });
                }
                set({
                    unreadMessages: {
                        ...unreadMessages,
                        [newMessage.senderId]: count + 1,
                    },
                });
            }

            if (selectedUser && newMessage.senderId === selectedUser._id) {
                set({ messages: [...messages, newMessage] });
            }
        });

        isSubscribed = true;
    },

    unsubcribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("newMessage");
        }
        isSubscribed = false;
    },

    getUnreadMessages: async () => {
        try {
            const res = await axiosInstance.get("/messages/unread-messages");
            const map = {};
            res.data.forEach(({ userId, unreadCount }) => {
                map[userId] = unreadCount;
            });
            set({ unreadMessages: map });
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    "Failed to fetch unread messages",
                { id: "unread-messages-error" },
            );
        }
    },

    markMessagesAsRead: async (userId) => {
        try {
            await axiosInstance.patch(`/messages/mark-read/${userId}`);
            // Cập nhật unreadMessages để xóa userId đó
            const newMap = { ...get().unreadMessages };
            delete newMap[userId];
            set({ unreadMessages: newMap });
        } catch (error) {
            console.error("Failed to mark messages as read", error);
        }
    },

    setSelectedUser: async (user) => {
        if (!user || !user._id) {
            set({ selectedUser: null, firstUnreadMessageId: null });
            return;
        }

        set({
            selectedUser: user,
            messages: [],
            hasMoreMessages: true,
        });

        // Không đánh dấu đã đọc ngay lập tức
        await get().getMessages(user._id); // Lấy tin nhắn => khi render, vẫn còn firstUnreadMessageId

        // Delay mark-as-read 1 nhịp sau khi render
        setTimeout(() => {
            get().markMessagesAsRead(user._id); // Gọi sau render
        }, 100);
    },
}));
