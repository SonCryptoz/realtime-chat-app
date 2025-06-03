import { useEffect, useRef, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";

import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime, formatMessageLink } from "../lib/utils.jsx";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessageLoading,
        isFetchingMoreMessages,
        hasMoreMessages,
        selectedUser,
        firstUnreadMessageId,
        typingStatus,
    } = useChatStore();

    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    const chatBoxRef = useRef(null);
    const topMessageRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const prevScrollHeightRef = useRef(0);

    // Xử lý scroll để load thêm khi lên đầu
    const handleScroll = useCallback(() => {
        const box = chatBoxRef.current;
        if (!box || isFetchingMoreMessages || !hasMoreMessages) return;

        const isNearTop = box.scrollTop === 0;
        const isNearBottom =
            box.scrollHeight - box.scrollTop - box.clientHeight < 100;

        isAtBottomRef.current = isNearBottom;

        if (isNearTop && messages.length > 0) {
            const oldestMessageId = messages[0]._id;
            prevScrollHeightRef.current = box.scrollHeight;

            getMessages(selectedUser._id, {
                beforeMessageId: oldestMessageId,
            }).then(() => {
                requestAnimationFrame(() => {
                    const newScrollHeight = box.scrollHeight;
                    const scrollDiff =
                        newScrollHeight - prevScrollHeightRef.current;
                    box.scrollTop = scrollDiff;
                });
            });
        }
    }, [
        messages,
        selectedUser,
        getMessages,
        isFetchingMoreMessages,
        hasMoreMessages,
    ]);

    // Load tin nhắn ban đầu
    useEffect(() => {
        if (!selectedUser) return;
        getMessages(selectedUser._id);
    }, [selectedUser, getMessages]);

    // Scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        setTimeout(() => {
            if (messageEndRef.current && isAtBottomRef.current) {
                messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }, 100); // Đợi DOM cập nhật
    }, [messages, typingStatus]);

    if (isMessageLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <ChatHeader />

            {/* Chat messages container */}
            <div
                ref={chatBoxRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {isFetchingMoreMessages && (
                    <div className="text-center text-sm text-gray-500 py-2">
                        Loading more messages...
                    </div>
                )}
                {messages.map((message, index) => {
                    const isSender =
                        (
                            message.senderId?._id || message.senderId
                        )?.toString() === authUser._id;

                    const isFirstUnread =
                        message._id?.toString() ===
                        firstUnreadMessageId?.toString();

                    const isFirstMessage = index === 0;

                    return (
                        <div
                            key={message._id}
                            ref={isFirstMessage ? topMessageRef : null}
                        >
                            {isFirstUnread && !isSender && (
                                <div className="flex items-center gap-4 my-2">
                                    <div className="flex-grow border-t" />
                                    <div className="text-sm text-center">
                                        Unread Messages
                                    </div>
                                    <div className="flex-grow border-t" />
                                </div>
                            )}

                            <div
                                className={`flex items-end ${
                                    isSender ? "justify-end" : "justify-start"
                                } gap-2`}
                            >
                                {!isSender && (
                                    <img
                                        src={
                                            selectedUser.profilePicture ||
                                            "/avatar.png"
                                        }
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                                <div
                                    className={`max-w-[80%] rounded-xl p-3 shadow-sm ${
                                        isSender
                                            ? "bg-primary text-primary-content rounded-br-none"
                                            : "bg-base-200 rounded-bl-none"
                                    }`}
                                >
                                    {message.image && (
                                        <img
                                            src={message.image}
                                            alt="Attachment"
                                            className="sm:max-w-[200px] rounded-md mb-2"
                                        />
                                    )}
                                    {message.text && (
                                        <p className="text-sm">
                                            {formatMessageLink(message.text)}
                                        </p>
                                    )}
                                    <p
                                        className={`text-[10px] mt-1.5 ${
                                            isSender
                                                ? "text-primary-content/70"
                                                : "text-base-content/70"
                                        }`}
                                    >
                                        {formatMessageTime(message.createdAt)}
                                    </p>
                                </div>
                                {isSender && (
                                    <img
                                        src={
                                            authUser.profilePicture ||
                                            "/avatar.png"
                                        }
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
                <AnimatePresence>
                    {selectedUser && typingStatus[selectedUser._id] && (
                        <Motion.div
                            key="typing"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-end gap-2"
                        >
                            <img
                                src={
                                    selectedUser.profilePicture || "/avatar.png"
                                }
                                alt="Avatar"
                                className="w-8 h-8 rounded-full"
                            />
                            <div className="rounded-xl p-3 shadow-sm bg-base-200 rounded-bl-none">
                                <div className="flex space-x-1">
                                    <span
                                        className="dot w-1 h-1 bg-base-content/70 rounded-full animate-bounce"
                                        style={{ animationDelay: "0s" }}
                                    ></span>
                                    <span
                                        className="dot w-1 h-1 bg-base-content/70 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                    ></span>
                                    <span
                                        className="dot w-1 h-1 bg-base-content/70 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.4s" }}
                                    ></span>
                                </div>
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>
                <div ref={messageEndRef} />
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatContainer;
