import axios from "axios";

const BACKEND_URL = (
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.MODE === "development" ? "http://localhost:5001" : "")
).replace(/\/$/, "");

export const axiosInstance = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
