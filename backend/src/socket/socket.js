import { Server } from "socket.io";

import { env } from "../config/env.js";
import { registerChatSocketHandlers } from "./chat.socket.js";

let ioInstance = null;

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    registerChatSocketHandlers(io, socket);
  });

  console.log("Socket.io initialized");

  return io;
};

export const getIo = () => {
  return ioInstance;
};