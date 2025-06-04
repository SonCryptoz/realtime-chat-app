import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useThemeStore } from "./store/useThemeStore";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const App = () => {
    const { authUser, checkAuth, isCheckingAuth, socket, connectSocket } =
        useAuthStore();
    const { isChatReady } = useChatStore();
    const { theme } = useThemeStore();

    // Gọi checkAuth khi app load lần đầu
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Gọi connectSocket đúng thời điểm khi authUser đã có
    useEffect(() => {
        if (authUser && !socket) {
            connectSocket();
        }
    }, [authUser, socket, connectSocket]);

    // Thêm sự kiện click để bật âm thanh thông báo
    useEffect(() => {
        const enableSound = () => {
            localStorage.setItem("canPlaySound", "true");
            document.removeEventListener("click", enableSound);
        };

        document.addEventListener("click", enableSound);

        return () => {
            document.removeEventListener("click", enableSound);
        };
    }, []);

    if ((isCheckingAuth && !authUser) || (authUser && !isChatReady)) {
        return (
            <div
                className="flex justify-center items-center h-screen"
                data-theme={theme}
            >
                <Loader className="size-10 animate-spin" />
            </div>
        );
    }

    return (
        <div data-theme={theme} className="h-full">
            <Navbar />

            <Routes>
                <Route
                    path="/"
                    element={
                        authUser ? <HomePage /> : <Navigate to="/signin" />
                    }
                />
                <Route
                    path="/signup"
                    element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
                />
                <Route
                    path="/verify-email/:token"
                    element={<VerifyEmailPage />}
                />
                <Route
                    path="/signin"
                    element={!authUser ? <SignInPage /> : <Navigate to="/" />}
                />
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />
                <Route
                    path="/reset-password/:token"
                    element={<ResetPasswordPage />}
                />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                    path="/profile"
                    element={
                        authUser ? <ProfilePage /> : <Navigate to="/signin" />
                    }
                />
            </Routes>

            <Toaster />
        </div>
    );
};

export default App;
