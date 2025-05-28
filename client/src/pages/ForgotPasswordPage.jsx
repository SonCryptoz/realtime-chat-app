import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

import AuthImagePattern from "../components/AuthImagePattern";
import { useAuthStore } from "../store/useAuthStore";

const ForgotPasswordPage = () => {
    const [formData, setFormData] = useState({ email: "" });
    const [isLoading, setIsLoading] = useState(false);

    const { forgotPassword } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await forgotPassword(formData.email);
        if (res) {
            setFormData({ email: "" });
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center gap-2 group">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <MessageSquare className="size-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mt-2">
                                You forgot password?
                            </h1>
                            <p className="text-base-content/60">
                                Enter your email and we will send you password
                                reset instructions.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value,
                                })
                            }
                            className="input input-bordered w-full"
                            placeholder="Enter your email"
                        />
                        <button
                            className="btn btn-primary w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending..." : "Send"}
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
                title="Forgot password?"
                subtitle="Don't worry, we will help you recover your password right away."
            />
        </div>
    );
};

export default ForgotPasswordPage;
