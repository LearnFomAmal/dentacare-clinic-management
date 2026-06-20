import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";
import { protectDoctor } from "../../middlewares/doctorAuth.middleware.js";

import {
  deleteAdminNotificationController,
  deleteDoctorNotificationController,
  deletePatientNotificationController,
  getAdminNotificationsController,
  getAdminUnreadCountController,
  getDoctorNotificationsController,
  getDoctorUnreadCountController,
  getPatientNotificationsController,
  getPatientUnreadCountController,
  markAdminNotificationReadController,
  markAllAdminNotificationsReadController,
  markAllDoctorNotificationsReadController,
  markAllPatientNotificationsReadController,
  markDoctorNotificationReadController,
  markPatientNotificationReadController,
} from "./notification.controller.js";

const router = express.Router();

// ==============================
// PATIENT NOTIFICATIONS
// ==============================
router.get("/patient", protect, getPatientNotificationsController);

router.get(
  "/patient/unread-count",
  protect,
  getPatientUnreadCountController
);

router.patch(
  "/patient/read-all",
  protect,
  markAllPatientNotificationsReadController
);

router.patch(
  "/patient/:notificationId/read",
  protect,
  markPatientNotificationReadController
);

router.delete(
  "/patient/:notificationId",
  protect,
  deletePatientNotificationController
);

// ==============================
// DOCTOR NOTIFICATIONS
// ==============================
router.get("/doctor", protectDoctor, getDoctorNotificationsController);

router.get(
  "/doctor/unread-count",
  protectDoctor,
  getDoctorUnreadCountController
);

router.patch(
  "/doctor/read-all",
  protectDoctor,
  markAllDoctorNotificationsReadController
);

router.patch(
  "/doctor/:notificationId/read",
  protectDoctor,
  markDoctorNotificationReadController
);

router.delete(
  "/doctor/:notificationId",
  protectDoctor,
  deleteDoctorNotificationController
);

// ==============================
// ADMIN NOTIFICATIONS
// ==============================
router.get("/admin", protectAdmin, getAdminNotificationsController);

router.get(
  "/admin/unread-count",
  protectAdmin,
  getAdminUnreadCountController
);

router.patch(
  "/admin/read-all",
  protectAdmin,
  markAllAdminNotificationsReadController
);

router.patch(
  "/admin/:notificationId/read",
  protectAdmin,
  markAdminNotificationReadController
);

router.delete(
  "/admin/:notificationId",
  protectAdmin,
  deleteAdminNotificationController
);

export default router;