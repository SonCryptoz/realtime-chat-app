import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/useAuthStore";

const VerifyEmailPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const { verifyEmail, isVerifying } = useAuthStore();

    const [status, setStatus] = useState("verifying"); // verifying | success | error
    const hasVerified = useRef(false); // Ngăn gọi verifyEmail 2 lần

    useEffect(() => {
        const handleVerification = async () => {
            const result = await verifyEmail(token);
            if (result.success) {
                setStatus("success");
                setTimeout(() => navigate("/signin", { replace: true }), 5000);
            } else {
                setStatus("error");
                toast.error(result.message || "Verification failed", {
                    id: "verified-error",
                });
            }
        };

        if (token && !hasVerified.current) {
            hasVerified.current = true;
            handleVerification();
        } else if (!token) {
            setStatus("error");
            toast.error("Invalid token");
        }
    }, [token, verifyEmail, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {(isVerifying || status === "verifying") && (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
                        <p>Verifying your email...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-green-600">
                        <h2 className="text-2xl font-semibold mb-2">
                            Email verified!
                        </h2>
                        <p>Redirecting to signin page...</p>
                    </div>
                )}

                {status === "error" && !isVerifying && (
                    <div className="text-red-600">
                        <h2 className="text-2xl font-semibold mb-2">
                            Verification failed
                        </h2>
                        <p>
                            Please check your verification link or try again
                            later.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
