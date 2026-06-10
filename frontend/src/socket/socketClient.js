import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getSocketBaseUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  return String(API_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
};

let socketInstance = null;

export const connectChatSocket = (role) => {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  socketInstance = io(getSocketBaseUrl(), {
    withCredentials: true,
    transports: ["websocket", "polling"],
    auth: {
      role,
    },
  });

  return socketInstance;
};

export const getChatSocket = () => {
  return socketInstance;
};

export const disconnectChatSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};