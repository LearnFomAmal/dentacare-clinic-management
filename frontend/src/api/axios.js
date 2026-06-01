import axios from "axios";

import { API_ENDPOINTS } from "./endpoints";
import {
  clearAuthStorage,
  getAccountType,
} from "../utils/authStorage";
import { navigateTo } from "../utils/navigation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Separate axios instance without interceptors.
 * Used only for refresh-token calls to avoid interceptor recursion.
 */
const refreshAxios = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const getRoleFromPath = () => {
  const pathname = window.location.pathname;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }

  if (pathname === "/doctor" || pathname.startsWith("/doctor/")) {
    return "doctor";
  }

  return "patient";
};

const getCurrentAccountType = () => {
  return getRoleFromPath();
};

const getRefreshEndpoint = (accountType) => {
  if (accountType === "patient") {
    return API_ENDPOINTS.AUTH.REFRESH_TOKEN;
  }

  if (accountType === "doctor") {
    return API_ENDPOINTS.DOCTOR.REFRESH_TOKEN;
  }

  if (accountType === "admin") {
    return API_ENDPOINTS.ADMIN.REFRESH_TOKEN;
  }

  return null;
};

const isAuthFreeRequest = (url = "") => {
  return (
    url.includes("/refresh-token") ||
    url.includes("/login") ||
    url.includes("/logout") ||
    url.includes("/register") ||
    url.includes("/forgot-password") ||
    url.includes("/reset-password") ||
    url.includes("/verify")
  );
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });

  failedQueue = [];
};

const forceLogout = (accountType) => {
  clearAuthStorage(accountType);

  if (!window.location.pathname.includes("/login")) {
    navigateTo("/login", { replace: true });
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const requestUrl = originalRequest?.url || "";

    const shouldTryRefresh =
      status === 401 &&
      !originalRequest._retry &&
      !isAuthFreeRequest(requestUrl);

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const accountType = getCurrentAccountType();
    const refreshEndpoint = getRefreshEndpoint(accountType);

    if (!refreshEndpoint) {
      forceLogout(accountType);
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(axiosInstance(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      await refreshAxios.post(refreshEndpoint);

      processQueue(null);

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      forceLogout(accountType);

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;