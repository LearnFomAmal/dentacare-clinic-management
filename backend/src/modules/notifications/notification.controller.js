import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  deleteNotificationService,
  getNotificationsService,
  getUnreadNotificationCountService,
  markAllNotificationsAsReadService,
  markNotificationAsReadService,
} from "./notification.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

const getDoctorId = (req) => {
  return req.doctor?.doctorId || req.doctor?._id || req.doctor?.id;
};

const getAdminId = (req) => {
  return req.admin?.adminId || req.admin?._id || req.admin?.id;
};

const getRecipientContext = (req, role) => {
  if (role === "patient") {
    return {
      recipientRole: "patient",
      recipientId: getPatientId(req),
    };
  }

  if (role === "doctor") {
    return {
      recipientRole: "doctor",
      recipientId: getDoctorId(req),
    };
  }

  return {
    recipientRole: "admin",
    recipientId: getAdminId(req),
  };
};

const getNotificationsByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getRecipientContext(req, role);

    const result = await getNotificationsService({
      ...context,
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Notifications fetched successfully",
      result
    );
  });

const getUnreadCountByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getRecipientContext(req, role);

    const result = await getUnreadNotificationCountService(context);

    sendResponse(
      res,
      200,
      true,
      "Unread notification count fetched successfully",
      result
    );
  });

const markNotificationReadByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getRecipientContext(req, role);

    const notification = await markNotificationAsReadService({
      ...context,
      notificationId: req.params.notificationId,
    });

    sendResponse(
      res,
      200,
      true,
      "Notification marked as read",
      notification
    );
  });

const markAllNotificationsReadByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getRecipientContext(req, role);

    const result = await markAllNotificationsAsReadService(context);

    sendResponse(
      res,
      200,
      true,
      "All notifications marked as read",
      result
    );
  });

const deleteNotificationByRole = (role) =>
  asyncHandler(async (req, res) => {
    const context = getRecipientContext(req, role);

    const result = await deleteNotificationService({
      ...context,
      notificationId: req.params.notificationId,
    });

    sendResponse(
      res,
      200,
      true,
      "Notification deleted successfully",
      result
    );
  });

export const getPatientNotificationsController =
  getNotificationsByRole("patient");

export const getPatientUnreadCountController =
  getUnreadCountByRole("patient");

export const markPatientNotificationReadController =
  markNotificationReadByRole("patient");

export const markAllPatientNotificationsReadController =
  markAllNotificationsReadByRole("patient");

export const deletePatientNotificationController =
  deleteNotificationByRole("patient");

export const getDoctorNotificationsController =
  getNotificationsByRole("doctor");

export const getDoctorUnreadCountController =
  getUnreadCountByRole("doctor");

export const markDoctorNotificationReadController =
  markNotificationReadByRole("doctor");

export const markAllDoctorNotificationsReadController =
  markAllNotificationsReadByRole("doctor");

export const deleteDoctorNotificationController =
  deleteNotificationByRole("doctor");

export const getAdminNotificationsController =
  getNotificationsByRole("admin");

export const getAdminUnreadCountController =
  getUnreadCountByRole("admin");

export const markAdminNotificationReadController =
  markNotificationReadByRole("admin");

export const markAllAdminNotificationsReadController =
  markAllNotificationsReadByRole("admin");

export const deleteAdminNotificationController =
  deleteNotificationByRole("admin");