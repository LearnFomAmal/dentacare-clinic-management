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
  const pathRole = getRoleFromPath();

  // Important:
  // On /doctor/* and /admin/* routes, path role is more reliable than old sessionStorage.
  if (pathRole === "doctor" || pathRole === "admin") {
    return pathRole;
  }

  return getAccountType() || "patient";
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

const normalizeRequestPath = (url = "") => {
  try {
    if (url.startsWith("http")) {
      return new URL(url).pathname;
    }

    return String(url).split("?")[0];
  } catch {
    return String(url).split("?")[0];
  }
};

const AUTH_FREE_ENDPOINTS = new Set([
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.REGISTER_RESEND_OTP,
  API_ENDPOINTS.AUTH.REGISTER_VERIFY_OTP,
  API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
  API_ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY_OTP,
  API_ENDPOINTS.AUTH.FORGOT_PASSWORD_RESEND_OTP,
  API_ENDPOINTS.AUTH.REFRESH_TOKEN,
  API_ENDPOINTS.AUTH.LOGOUT,

  API_ENDPOINTS.DOCTOR.LOGIN,
  API_ENDPOINTS.DOCTOR.REGISTER,
  API_ENDPOINTS.DOCTOR.REGISTER_VERIFY_OTP,
  API_ENDPOINTS.DOCTOR.REGISTER_RESEND_OTP,
  API_ENDPOINTS.DOCTOR.VERIFY_ACCOUNT,
  API_ENDPOINTS.DOCTOR.RESEND_VERIFICATION_OTP,
  API_ENDPOINTS.DOCTOR.FORGOT_PASSWORD,
  API_ENDPOINTS.DOCTOR.RESET_PASSWORD,
  API_ENDPOINTS.DOCTOR.RESEND_FORGOT_PASSWORD_OTP,
  API_ENDPOINTS.DOCTOR.REFRESH_TOKEN,
  API_ENDPOINTS.DOCTOR.LOGOUT,

  API_ENDPOINTS.ADMIN.LOGIN,
  API_ENDPOINTS.ADMIN.FORGOT_PASSWORD,
  API_ENDPOINTS.ADMIN.VERIFY_FORGOT_OTP,
  API_ENDPOINTS.ADMIN.RESET_PASSWORD,
  API_ENDPOINTS.ADMIN.RESEND_FORGOT_OTP,
  API_ENDPOINTS.ADMIN.REFRESH_TOKEN,
  API_ENDPOINTS.ADMIN.LOGOUT,
]);

const isAuthFreeRequest = (url = "") => {
  const path = normalizeRequestPath(url);
  return AUTH_FREE_ENDPOINTS.has(path);
};

const isBlockedOrDeletedResponse = (error) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || "").toLowerCase();

  if (status !== 403 && status !== 401) {
    return false;
  }

  return (
    message.includes("blocked") ||
    message.includes("deleted") ||
    message.includes("account blocked") ||
    message.includes("account deleted")
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

  const loginPath = accountType === "admin" ? "/admin/login" : "/login";

  if (window.location.pathname !== loginPath) {
    navigateTo(loginPath, {
      replace: true,
    });
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
    const accountType = getCurrentAccountType();

    if (isBlockedOrDeletedResponse(error)) {
      forceLogout(accountType);
      return Promise.reject(error);
    }

    const shouldTryRefresh =
      status === 401 &&
      !originalRequest._retry &&
      !isAuthFreeRequest(requestUrl);

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

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