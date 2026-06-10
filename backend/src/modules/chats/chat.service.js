import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

import {
  countChatsForDoctor,
  countChatsForPatient,
  countMessagesByChatId,
  createChat,
  createChatMessage,
  findAppointmentForChat,
  findChatByAppointmentId,
  findChatById,
  findChatsForDoctor,
  findChatsForPatient,
  findMessagesByChatId,
  markMessagesAsReadForReceiver,
  saveChat,
} from "./chat.repository.js";

import {
  validateChatRole,
  validateObjectId,
  validatePagination,
  validateSendMessageInput,
} from "./chat.validator.js";

const getMongoId = (value) => {
  return value?._id || value;
};

const toStringId = (value) => {
  return String(getMongoId(value));
};

const buildRoomName = (appointmentId) => {
  return `chat:appointment:${appointmentId}`;
};

const normalizeChat = (chat, currentRole = "") => {
  const unreadCount =
    currentRole === "patient"
      ? chat.patientUnreadCount || 0
      : currentRole === "doctor"
        ? chat.doctorUnreadCount || 0
        : 0;

  return {
    ...chat,
    unreadCount,
    roomName: buildRoomName(chat.appointmentId?._id || chat.appointmentId),
  };
};

const ensureAppointmentChatAccess = async ({
  appointmentId,
  userId,
  role,
}) => {
  validateObjectId(appointmentId, "appointment id");
  validateObjectId(userId, `${role} id`);
  validateChatRole(role);

  const appointment = await findAppointmentForChat({
    appointmentId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status !== "approved") {
    throw new AppError(
      "Chat is available only for approved appointments",
      403
    );
  }

  if (appointment.paymentStatus !== "paid") {
    throw new AppError(
      "Chat is available only for paid appointments",
      403
    );
  }

  const patientId = toStringId(appointment.patientId);
  const doctorId = toStringId(appointment.doctorId);

  if (role === "patient" && patientId !== String(userId)) {
    throw new AppError("You are not allowed to access this chat", 403);
  }

  if (role === "doctor" && doctorId !== String(userId)) {
    throw new AppError("You are not allowed to access this chat", 403);
  }

  return appointment;
};

const getOrCreateChatForAppointment = async (appointment) => {
  const appointmentId = appointment._id;

  const existingChat = await findChatByAppointmentId({
    appointmentId,
  });

  if (existingChat) {
    return existingChat;
  }

  try {
    return await createChat({
      payload: {
        appointmentId,
        patientId: getMongoId(appointment.patientId),
        doctorId: getMongoId(appointment.doctorId),
        isActive: true,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const chat = await findChatByAppointmentId({
        appointmentId,
      });

      if (chat) return chat;
    }

    throw error;
  }
};

const ensureChatAccessByChatId = async ({ chatId, userId, role }) => {
  validateObjectId(chatId, "chat id");
  validateObjectId(userId, `${role} id`);
  validateChatRole(role);

  const chat = await findChatById({
    chatId,
  });

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  if (role === "patient" && String(chat.patientId) !== String(userId)) {
    throw new AppError("You are not allowed to access this chat", 403);
  }

  if (role === "doctor" && String(chat.doctorId) !== String(userId)) {
    throw new AppError("You are not allowed to access this chat", 403);
  }

  return chat;
};

export const getMyChatsService = async ({ userId, role, query }) => {
  validateObjectId(userId, `${role} id`);
  validateChatRole(role);

  const { page, limit } = validatePagination(query);
  const skip = (page - 1) * limit;

  const [chats, totalChats] =
    role === "patient"
      ? await Promise.all([
          findChatsForPatient({
            patientId: userId,
            skip,
            limit,
          }),
          countChatsForPatient({
            patientId: userId,
          }),
        ])
      : await Promise.all([
          findChatsForDoctor({
            doctorId: userId,
            skip,
            limit,
          }),
          countChatsForDoctor({
            doctorId: userId,
          }),
        ]);

  return {
    chats: chats.map((chat) => normalizeChat(chat, role)),
    pagination: {
      page,
      limit,
      totalChats,
      totalPages: Math.ceil(totalChats / limit),
    },
  };
};

export const getAppointmentMessagesService = async ({
  appointmentId,
  userId,
  role,
  query,
}) => {
  const appointment = await ensureAppointmentChatAccess({
    appointmentId,
    userId,
    role,
  });

  const chat = await getOrCreateChatForAppointment(appointment);

  const { page, limit } = validatePagination(query);
  const skip = (page - 1) * limit;

  const [messages, totalMessages] = await Promise.all([
    findMessagesByChatId({
      chatId: chat._id,
      skip,
      limit,
    }),
    countMessagesByChatId({
      chatId: chat._id,
    }),
  ]);

  const orderedMessages = [...messages].reverse();

  return {
    chat: normalizeChat(chat.toObject ? chat.toObject() : chat, role),
    messages: orderedMessages,
    roomName: buildRoomName(appointmentId),
    pagination: {
      page,
      limit,
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
    },
  };
};

export const sendChatMessageService = async ({
  appointmentId,
  userId,
  role,
  body,
}) => {
  const { text } = validateSendMessageInput(body);

  const appointment = await ensureAppointmentChatAccess({
    appointmentId,
    userId,
    role,
  });

  const chat = await getOrCreateChatForAppointment(appointment);

  const patientId = getMongoId(appointment.patientId);
  const doctorId = getMongoId(appointment.doctorId);

  const senderId =
    role === "patient"
      ? new mongoose.Types.ObjectId(patientId)
      : new mongoose.Types.ObjectId(doctorId);

  const receiverId =
    role === "patient"
      ? new mongoose.Types.ObjectId(doctorId)
      : new mongoose.Types.ObjectId(patientId);

  const receiverRole = role === "patient" ? "doctor" : "patient";

  const message = await createChatMessage({
    payload: {
      chatId: chat._id,
      appointmentId: appointment._id,
      senderId,
      senderRole: role,
      receiverId,
      receiverRole,
      text,
      messageType: "text",
      isRead: false,
    },
  });

  chat.lastMessage = {
    text,
    senderId,
    senderRole: role,
    sentAt: message.createdAt,
  };

  chat.lastMessageAt = message.createdAt;

  if (role === "patient") {
    chat.doctorUnreadCount = Number(chat.doctorUnreadCount || 0) + 1;
    chat.patientUnreadCount = 0;
  } else {
    chat.patientUnreadCount = Number(chat.patientUnreadCount || 0) + 1;
    chat.doctorUnreadCount = 0;
  }

  await saveChat(chat);

  return {
    chat: normalizeChat(chat.toObject ? chat.toObject() : chat, role),
    message: message.toObject ? message.toObject() : message,
    roomName: buildRoomName(appointmentId),
  };
};

export const markChatAsReadService = async ({ chatId, userId, role }) => {
  const chat = await ensureChatAccessByChatId({
    chatId,
    userId,
    role,
  });

  await markMessagesAsReadForReceiver({
    chatId: chat._id,
    receiverId: userId,
    receiverRole: role,
  });

  if (role === "patient") {
    chat.patientUnreadCount = 0;
  }

  if (role === "doctor") {
    chat.doctorUnreadCount = 0;
  }

  await saveChat(chat);

  return {
    chat: normalizeChat(chat.toObject ? chat.toObject() : chat, role),
  };
};

export const validateSocketChatAccessService = async ({
  appointmentId,
  userId,
  role,
}) => {
  const appointment = await ensureAppointmentChatAccess({
    appointmentId,
    userId,
    role,
  });

  const chat = await getOrCreateChatForAppointment(appointment);

  return {
    appointment,
    chat,
    roomName: buildRoomName(appointmentId),
  };
};