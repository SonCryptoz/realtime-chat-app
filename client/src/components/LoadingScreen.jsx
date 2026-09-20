import { useEffect, useState } from "react";
import { Server, Clock, Sparkles } from "lucide-react";

const LoadingScreen = () => {
    const [seconds, setSeconds] = useState(0);
    const [isLongWait, setIsLongWait] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);

        const timer = setTimeout(() => {
            setIsLongWait(true);
        }, 2500);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4 bg-base-200/50">
            <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300 p-6 sm:p-8 text-center">
                {/* Icon & Pulse Indicator */}
                <div className="relative mx-auto mb-4 flex items-center justify-center">
                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Server className="size-8 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                    </span>
                </div>

                <h2 className="text-xl font-bold mb-2">
                    {isLongWait
                        ? "Đang đánh thức máy chủ..."
                        : "Đang tải ứng dụng..."}
                </h2>

                <p className="text-sm text-base-content/70 mb-4 leading-relaxed">
                    {isLongWait ? (
                        <>
                            Máy chủ backend (Render Free) đang khởi động lại từ
                            chế độ ngủ. Quá trình này thường mất từ{" "}
                            <span className="font-semibold text-primary">
                                30 - 50 giây
                            </span>{" "}
                            cho lần truy cập đầu tiên.
                        </>
                    ) : (
                        "Vui lòng đợi giây lát trong khi hệ thống thiết lập kết nối."
                    )}
                </p>

                {/* Progress bar and counter */}
                <div className="space-y-2 mb-4">
                    <progress className="progress progress-primary w-full"></progress>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-base-content/60 font-mono">
                        <Clock className="size-3.5" />
                        <span>Thời gian chờ: {seconds}s</span>
                    </div>
                </div>

                {/* Recruiter / Info Note */}
                {isLongWait && (
                    <div className="alert bg-info/10 text-info-content border border-info/20 text-xs text-left p-3 rounded-lg mt-2">
                        <div className="flex items-start gap-2">
                            <Sparkles className="size-4 shrink-0 text-info mt-0.5" />
                            <div>
                                <span className="text-base-content/80">
                                    Đây là cơ chế tự động ngủ của gói Cloud Free
                                    Tier. Khi máy chủ đã thức dậy, mọi tính năng
                                    chat thời gian thực sẽ phản hồi tức thì!
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadingScreen;
