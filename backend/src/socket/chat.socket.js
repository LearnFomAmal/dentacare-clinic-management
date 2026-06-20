import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { findUserById } from "../modules/users/user.repository.js";
import { findDoctorById } from "../modules/doctors/doctor.repository.js";
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

const authenticateSocket = async (socket) => {
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

    const doctor = await findDoctorById(decoded.doctorId);

    if (!doctor || doctor.accountStatus?.isDeleted) {
      throw new Error("Doctor account not found");
    }

    if (doctor.accountStatus?.isBlocked) {
      throw new Error("Doctor account is blocked");
    }

    if (!doctor.accountStatus?.isEmailVerified) {
      throw new Error("Please verify your email first");
    }

    if (!doctor.accountStatus?.isVerified) {
      throw new Error("Doctor documents are not approved yet");
    }

    if (doctor.verification?.status !== "approved") {
      throw new Error("Doctor verification is not approved");
    }

    return {
      role: "doctor",
      userId: doctor._id.toString(),
    };
  }

  if (decoded.role !== "patient" || !decoded.userId) {
    throw new Error("Invalid patient socket token");
  }

  const user = await findUserById(decoded.userId);

  if (!user || user.accountStatus?.isDeleted) {
    throw new Error("Patient account not found");
  }

  if (user.accountStatus?.isBlocked) {
    throw new Error("Patient account is blocked");
  }

  if (!user.accountStatus?.isVerified) {
    throw new Error("Patient account is not verified");
  }

  return {
    role: "patient",
    userId: user._id.toString(),
  };
};

export const registerChatSocketHandlers = async (io, socket) => {
  let authContext = null;

  try {
    authContext = await authenticateSocket(socket);

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

  socket.on(
    "send_message",
    async ({ appointmentId, text, clientTempId } = {}, ack) => {
      try {
        const result = await sendChatMessageService({
          appointmentId,
          userId: authContext.userId,
          role: authContext.role,
          body: {
            text,
          },
        });

        const payload = {
          message: result.message,
          chat: result.chat,
          clientTempId: clientTempId || null,
        };

        io.to(result.roomName).emit("receive_message", payload);

        if (typeof ack === "function") {
          ack({
            success: true,
            ...payload,
          });
        }
      } catch (error) {
        const message = error.message || "Failed to send message";

        socket.emit("chat_error", {
          message,
        });

        if (typeof ack === "function") {
          ack({
            success: false,
            message,
          });
        }
      }
    }
  );

  socket.on("mark_chat_read", async ({ chatId } = {}) => {
    try {
      const result = await markChatAsReadService({
        chatId,
        userId: authContext.userId,
        role: authContext.role,
      });

      const appointmentId =
        result.chat?.appointmentId?._id || result.chat?.appointmentId;

      const roomName = appointmentId
        ? `chat:appointment:${appointmentId}`
        : null;

      const payload = {
        ...result,
        readerRole: authContext.role,
      };

      if (roomName) {
        io.to(roomName).emit("messages_read", payload);
      } else {
        socket.emit("messages_read", payload);
      }
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