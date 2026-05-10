import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://your-app.onrender.com";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development"
    ? "http://localhost:5001/api"
    : `${BACKEND_URL}/api`,
  withCredentials: true,
});