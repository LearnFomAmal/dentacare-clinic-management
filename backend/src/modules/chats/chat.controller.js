import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  getAppointmentMessagesService,
  getMyChatsService,
  markChatAsReadService,
  sendChatMessageService,
} from "./chat.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

const getDoctorId = (req) => {
  return req.doctor?.doctorId || req.doctor?._id || req.doctor?.id;
};

const getUserContext = (req, role) => {
  if (role === "doctor") {
    return {
      role: "doctor",
      userId: getDoctorId(req),
    };
  }

  return {
    role: "patient",
    userId: getPatientId(req),
  };
};

const getMyChatsByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getUserContext(req, role);

    const result = await getMyChatsService({
      ...context,
      query: req.query,
    });

    sendResponse(res, 200, true, "Chats fetched successfully", result);
  });

const getAppointmentMessagesByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getUserContext(req, role);

    const result = await getAppointmentMessagesService({
      ...context,
      appointmentId: req.params.appointmentId,
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Chat messages fetched successfully",
      result
    );
  });

const sendMessageByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getUserContext(req, role);

    const result = await sendChatMessageService({
      ...context,
      appointmentId: req.params.appointmentId,
      body: req.body,
    });

    sendResponse(res, 201, true, "Message sent successfully", result);
  });

const markChatReadByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getUserContext(req, role);

    const result = await markChatAsReadService({
      ...context,
      chatId: req.params.chatId,
    });

    sendResponse(res, 200, true, "Chat marked as read", result);
  });

export const getPatientChatsController = getMyChatsByRole("patient");
export const getPatientAppointmentMessagesController =
  getAppointmentMessagesByRole("patient");
export const sendPatientMessageController = sendMessageByRole("patient");
export const markPatientChatReadController = markChatReadByRole("patient");

export const getDoctorChatsController = getMyChatsByRole("doctor");
export const getDoctorAppointmentMessagesController =
  getAppointmentMessagesByRole("doctor");
export const sendDoctorMessageController = sendMessageByRole("doctor");
export const markDoctorChatReadController = markChatReadByRole("doctor");