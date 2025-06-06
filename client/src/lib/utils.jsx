// Định dạng thời gian tin nhắn
export function formatMessageTime(date) {
    return new Date(date).toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

// Định dạng liên kết trong tin nhắn
export const formatMessageLink = (text) => {
    if (typeof text !== "string") return text;

    const urlRegex =
        /((https?:\/\/)?([\w-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?)/gi;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        const { index } = match;
        const rawUrl = match[0];
        const href = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

        if (index > lastIndex) {
            parts.push(
                <span key={`text-${index}`}>
                    {text.slice(lastIndex, index)}
                </span>,
            );
        }

        parts.push(
            <a
                key={`link-${index}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline break-all"
            >
                {rawUrl}
            </a>,
        );

        lastIndex = index + rawUrl.length;
    }

    if (lastIndex < text.length) {
        parts.push(
            <span key={`last-${lastIndex}`}>{text.slice(lastIndex)}</span>,
        );
    }

    return parts;
};

// Phát tiếng thông báo khi có tin nhắn mới
export const playNotificationSound = () => {
    try {
        // Kiểm tra xem user đã tương tác với trang chưa (nếu bạn có flag)
        const canPlay = localStorage.getItem("canPlaySound") === "true";
        if (!canPlay) return;

        // Luôn tạo mới Audio object để tránh lỗi không phát lại
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 1;
        audio.load();
        audio.currentTime = 0;

        audio.play().catch((error) => {
            console.warn("Playback blocked by browser:", error);
        });
    } catch (err) {
        console.error("Error playing notification sound:", err);
    }
};
