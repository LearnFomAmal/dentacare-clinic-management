import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import {
  markChatAsReadService,
  sendChatMessageService,
  validateSocketChatAccessService,
} from "../modules/chats/chat.service.js";

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (!key) return acc;

    acc[key] = decodeURIComponent(valueParts.join("=") || "");
    return acc;
  }, {});
};

const authenticateSocket = (socket) => {
  const cookies = parseCookies(socket.handshake.headers.cookie || "");
  const requestedRole = socket.handshake.auth?.role;

  const role = requestedRole === "doctor" ? "doctor" : "patient";

  const token =
    role === "doctor"
      ? cookies.doctorAccessToken
      : cookies.patientAccessToken;

  if (!token) {
    throw new Error("Unauthorized socket connection");
  }

  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

  if (role === "doctor") {
    if (decoded.role !== "doctor" || !decoded.doctorId) {
      throw new Error("Invalid doctor socket token");
    }

    return {
      role: "doctor",
      userId: decoded.doctorId,
    };
  }

  if (decoded.role !== "patient" || !decoded.userId) {
    throw new Error("Invalid patient socket token");
  }

  return {
    role: "patient",
    userId: decoded.userId,
  };
};

export const registerChatSocketHandlers = (io, socket) => {
  let authContext = null;

  try {
    authContext = authenticateSocket(socket);
    socket.data.userId = authContext.userId;
    socket.data.role = authContext.role;
  } catch (error) {
    socket.emit("chat_error", {
      message: error.message || "Socket authentication failed",
    });

    socket.disconnect(true);
    return;
  }

  socket.on("join_chat", async ({ appointmentId } = {}) => {
    try {
      const result = await validateSocketChatAccessService({
        appointmentId,
        userId: authContext.userId,
        role: authContext.role,
      });

      socket.join(result.roomName);

      socket.emit("chat_joined", {
        chat: result.chat,
        roomName: result.roomName,
      });
    } catch (error) {
      socket.emit("chat_error", {
        message: error.message || "Failed to join chat",
      });
    }
  });

  socket.on("send_message", async ({ appointmentId, text, clientTempId } = {}) => {
    try {
      const result = await sendChatMessageService({
        appointmentId,
        userId: authContext.userId,
        role: authContext.role,
        body: {
          text,
        },
      });

      io.to(result.roomName).emit("receive_message", {
        message: result.message,
        chat: result.chat,
        clientTempId: clientTempId || null,
      });
    } catch (error) {
      socket.emit("chat_error", {
        message: error.message || "Failed to send message",
      });
    }
  });

  socket.on("mark_chat_read", async ({ chatId } = {}) => {
    try {
      const result = await markChatAsReadService({
        chatId,
        userId: authContext.userId,
        role: authContext.role,
      });

      socket.emit("messages_read", result);
    } catch (error) {
      socket.emit("chat_error", {
        message: error.message || "Failed to mark chat as read",
      });
    }
  });

  socket.on("leave_chat", ({ appointmentId } = {}) => {
    if (!appointmentId) return;

    socket.leave(`chat:appointment:${appointmentId}`);
  });
};