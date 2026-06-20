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
  populateChat,
  saveChat,
} from "./chat.repository.js";

import {
  validateChatRole,
  validateObjectId,
  validatePagination,
  validateSendMessageInput,
} from "./chat.validator.js";

const READABLE_CHAT_STATUSES = ["approved", "completed", "cancelled"];
const READABLE_PAYMENT_STATUSES = ["paid", "refunded"];

const getMongoId = (value) => {
  return value?._id || value;
};

const toStringId = (value) => {
  return String(getMongoId(value));
};

const toPlainObject = (value) => {
  return value?.toObject ? value.toObject() : value;
};

const buildRoomName = (appointmentId) => {
  return `chat:appointment:${appointmentId}`;
};

const getReadOnlyReason = (appointment) => {
  if (!appointment) return "Chat is unavailable.";

  if (appointment.status === "completed") {
    return "This appointment is completed. Chat history is available, but new messages are disabled.";
  }

  if (appointment.status === "cancelled") {
    return "This appointment is cancelled. Chat history is available, but new messages are disabled.";
  }

  if (appointment.status !== "approved") {
    return "Chat is available only after appointment approval.";
  }

  if (appointment.paymentStatus !== "paid") {
    return "Chat is available only for paid appointments.";
  }

  return "";
};

const canReadAppointmentChat = (appointment) => {
  return Boolean(
    appointment &&
      READABLE_CHAT_STATUSES.includes(appointment.status) &&
      READABLE_PAYMENT_STATUSES.includes(appointment.paymentStatus)
  );
};

const canSendAppointmentChat = (appointment) => {
  return Boolean(
    appointment &&
      appointment.status === "approved" &&
      appointment.paymentStatus === "paid"
  );
};

const normalizeChat = (chat, currentRole = "") => {
  const plainChat = toPlainObject(chat);

  const appointment =
    typeof plainChat.appointmentId === "object"
      ? plainChat.appointmentId
      : null;

  const canSendMessage = canSendAppointmentChat(appointment);

  const unreadCount =
    currentRole === "patient"
      ? plainChat.patientUnreadCount || 0
      : currentRole === "doctor"
        ? plainChat.doctorUnreadCount || 0
        : 0;

  return {
    ...plainChat,
    unreadCount,
    canSendMessage,
    isReadOnly: !canSendMessage,
    readOnlyReason: canSendMessage ? "" : getReadOnlyReason(appointment),
    roomName: buildRoomName(
      plainChat.appointmentId?._id || plainChat.appointmentId
    ),
  };
};

const ensureAppointmentParticipantAndAccounts = async ({
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

  const patient = appointment.patientId;
  const doctor = appointment.doctorId;

  if (!patient || patient.accountStatus?.isDeleted) {
    throw new AppError("Patient account not found", 404);
  }

  if (patient.accountStatus?.isBlocked) {
    throw new AppError("Patient account is blocked", 403);
  }

  if (!doctor || doctor.accountStatus?.isDeleted) {
    throw new AppError("Doctor account not found", 404);
  }

  if (doctor.accountStatus?.isBlocked) {
    throw new AppError("Doctor account is blocked", 403);
  }

  if (!doctor.accountStatus?.isEmailVerified) {
    throw new AppError("Doctor email is not verified", 403);
  }

  if (!doctor.accountStatus?.isVerified) {
    throw new AppError("Doctor documents are not approved", 403);
  }

  if (doctor.verification?.status !== "approved") {
    throw new AppError("Doctor verification is not approved", 403);
  }

  const patientId = toStringId(patient);
  const doctorId = toStringId(doctor);

  if (role === "patient" && patientId !== String(userId)) {
    throw new AppError("You are not allowed to access this chat", 403);
  }

  if (role === "doctor" && doctorId !== String(userId)) {
    throw new AppError("You are not allowed to access this chat", 403);
  }

  return appointment;
};

const ensureAppointmentChatAccess = async ({
  appointmentId,
  userId,
  role,
  mode = "read",
}) => {
  const appointment = await ensureAppointmentParticipantAndAccounts({
    appointmentId,
    userId,
    role,
  });

  if (mode === "send") {
    if (!canSendAppointmentChat(appointment)) {
      throw new AppError(getReadOnlyReason(appointment), 403);
    }

    return appointment;
  }

  if (!canReadAppointmentChat(appointment)) {
    throw new AppError(
      "Chat is available only for approved, completed, or cancelled paid appointments",
      403
    );
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

  if (!canSendAppointmentChat(appointment)) {
    throw new AppError("No chat history found for this appointment", 404);
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

const getReadableChatForAppointment = async (appointment) => {
  if (canSendAppointmentChat(appointment)) {
    return getOrCreateChatForAppointment(appointment);
  }

  const existingChat = await findChatByAppointmentId({
    appointmentId: appointment._id,
  });

  if (!existingChat) {
    throw new AppError("No chat history found for this appointment", 404);
  }

  return existingChat;
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

  if (role === "patient" && toStringId(chat.patientId) !== String(userId)) {
    throw new AppError("You are not allowed to access this chat", 403);
  }

  if (role === "doctor" && toStringId(chat.doctorId) !== String(userId)) {
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
    mode: "read",
  });

  const chat = await getReadableChatForAppointment(appointment);

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
  const populatedChat = await populateChat(chat);

  return {
    chat: normalizeChat(populatedChat, role),
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
    mode: "send",
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

  const populatedChat = await populateChat(chat);

  return {
    chat: normalizeChat(populatedChat, role),
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

  const populatedChat = await populateChat(chat);

  return {
    chat: normalizeChat(populatedChat, role),
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
    mode: "read",
  });

  const chat = await getReadableChatForAppointment(appointment);
  const populatedChat = await populateChat(chat);

  return {
    appointment,
    chat: normalizeChat(populatedChat, role),
    roomName: buildRoomName(appointmentId),
  };
};

export const ensureChatExistsForApprovedAppointmentService = async ({
  appointmentId,
}) => {
  validateObjectId(appointmentId, "appointment id");

  const appointment = await findAppointmentForChat({
    appointmentId,
  });

  if (!appointment) {
    return null;
  }

  if (!canSendAppointmentChat(appointment)) {
    return null;
  }

  const chat = await getOrCreateChatForAppointment(appointment);
  const populatedChat = await populateChat(chat);

  return normalizeChat(populatedChat);
};