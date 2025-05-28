import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";

import AuthImagePattern from "../components/AuthImagePattern";
import { useAuthStore } from "../store/useAuthStore";

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { resetPassword } = useAuthStore();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.error("Please fill in all fields", {
                id: "empty-fields",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match", {
                id: "password-mismatch",
            });
            return;
        }

        setIsLoading(true);
        const res = await resetPassword(token, password);
        if (res) {
            navigate("/signin", { replace: true });
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo and Title */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center gap-2 group">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <LockKeyhole className="size-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mt-2">
                                Set a new password
                            </h1>
                            <p className="text-base-content/60">
                                Enter your new password below and confirm it to
                                reset your account access.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input input-bordered w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                className="input input-bordered w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword((prev) => !prev)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>

                        <div className="text-center">
                            <p className="text-base-content/60">
                                Remember password?{" "}
                                <Link
                                    to="/signin"
                                    className="link link-primary"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Side */}
            <AuthImagePattern
                title="Reset your password"
                subtitle="Take a fresh start with a new password to access your account."
            />
        </div>
    );
};

export default ResetPasswordPage;
