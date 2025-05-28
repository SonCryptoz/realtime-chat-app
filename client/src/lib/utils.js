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
