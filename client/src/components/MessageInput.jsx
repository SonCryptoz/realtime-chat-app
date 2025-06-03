import { useRef, useState, useEffect } from "react";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);

    const [isSending, setIsSending] = useState(false);

    const fileInputRef = useRef(null);

    const { sendMessage } = useChatStore();

    const { selectedUser } = useChatStore();
    const { socket } = useAuthStore();
    const typingTimeoutRef = useRef(null);

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreview(reader.result);
                    };
                    reader.onerror = () => {
                        toast.error("Error loading pasted image");
                    };
                    reader.readAsDataURL(file);
                }
                e.preventDefault(); // Ngăn dán ảnh dưới dạng text vào input
                break;
            }
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setImagePreview(null);
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setImagePreview(reader.result);
        };

        reader.onerror = () => {
            setImagePreview(null);
            toast.error("Error loading image");
        };

        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null; // reset input file để có thể chọn lại file cũ
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;

        setIsSending(true);
        try {
            await sendMessage({ text: text.trim(), image: imagePreview });
            socket.emit("stopTyping", selectedUser._id);

            // Reset input
            setText("");
            removeImage();
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        return () => {
            clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    return (
        <div className="p-4 w-full">
            {/* Image preview */}
            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Image preview"
                            className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                        />
                        <button
                            onClick={removeImage}
                            type="button"
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
                            aria-label="Remove image preview"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Form input */}
            <form
                onSubmit={handleSendMessage}
                className="flex flex-wrap items-center gap-2 pb-4 pt-4 border-t border-base-300 bg-base-100"
            >
                <div className="flex-1 flex gap-2 min-w-0">
                    <input
                        type="text"
                        className="input input-bordered flex-1 text-sm h-10 min-w-0"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => {
                            const value = e.target.value;
                            setText(value);

                            if (!socket || !selectedUser) return;

                            socket.emit("typing", selectedUser._id);

                            // Reset timeout mỗi lần gõ
                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                                socket.emit("stopTyping", selectedUser._id);
                            }, 2000); // Sau 2 giây không gõ sẽ gửi stopTyping
                        }}
                        onPaste={handlePaste}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />
                    <button
                        type="button"
                        className={`sm:flex btn h-10 min-h-0 ${
                            imagePreview ? "text-emerald-500" : "text-zinc-400"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Upload image"
                    >
                        <Image size={18} />
                    </button>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary h-10 min-h-0"
                    disabled={isSending || (!text.trim() && !imagePreview)}
                    aria-label="Send message"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
