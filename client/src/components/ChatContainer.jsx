import { useEffect, useRef, useCallback } from "react";

import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessageLoading,
        isFetchingMoreMessages,
        hasMoreMessages,
        selectedUser,
        firstUnreadMessageId,
    } = useChatStore();

    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    const chatBoxRef = useRef(null);
    const topMessageRef = useRef(null);
    const prevScrollHeightRef = useRef(0);

    // Load tin nhắn ban đầu
    useEffect(() => {
        if (!selectedUser) return;
        getMessages(selectedUser._id);
    }, [selectedUser, getMessages]);

    // Scroll xuống cuối khi có tin nhắn mới (chỉ lần đầu)
    useEffect(() => {
        if (messageEndRef.current && messages.length > 0) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Xử lý scroll để load thêm khi lên đầu
    const handleScroll = useCallback(async () => {
        const box = chatBoxRef.current;
        if (!box || isFetchingMoreMessages || !hasMoreMessages) return;

        if (box.scrollTop === 0 && messages.length > 0) {
            const oldestMessageId = messages[0]._id;
            prevScrollHeightRef.current = box.scrollHeight;

            await getMessages(selectedUser._id, {
                beforeMessageId: oldestMessageId,
            });

            // Sau khi load xong, giữ nguyên vị trí scroll
            requestAnimationFrame(() => {
                const newScrollHeight = box.scrollHeight;
                const scrollDiff =
                    newScrollHeight - prevScrollHeightRef.current;
                box.scrollTop = scrollDiff;
            });
        }
    }, [
        messages,
        selectedUser,
        getMessages,
        isFetchingMoreMessages,
        hasMoreMessages,
    ]);

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
                                            {message.text}
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
                <div ref={messageEndRef} />
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatContainer;
