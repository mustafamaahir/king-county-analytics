/**
 * client.js
 * Axios instance pointed at the FastAPI backend.
 * All page components import { api } from here — never hardcode URLs elsewhere.
 */
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 60000, // 60s — accounts for Render cold start
  headers: { "Content-Type": "application/json" },
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timed out — backend may be cold starting");
    }
    return Promise.reject(error);
  }
);
