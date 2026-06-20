import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { protectDoctor,requireVerifiedDoctor } from "../../middlewares/doctorAuth.middleware.js";

import {
  getDoctorAppointmentMessagesController,
  getDoctorChatsController,
  getPatientAppointmentMessagesController,
  getPatientChatsController,
  markDoctorChatReadController,
  markPatientChatReadController,
  sendDoctorMessageController,
  sendPatientMessageController,
} from "./chat.controller.js";

const router = express.Router();

// ==============================
// PATIENT CHAT ROUTES
// ==============================
router.get("/patient/my", protect, getPatientChatsController);

router.get(
  "/patient/appointments/:appointmentId/messages",
  protect,
  getPatientAppointmentMessagesController
);

router.post(
  "/patient/appointments/:appointmentId/messages",
  protect,
  sendPatientMessageController
);

router.patch(
  "/patient/:chatId/read",
  protect,
  markPatientChatReadController
);

// ==============================
// DOCTOR CHAT ROUTES
// ==============================
router.get("/doctor/my", protectDoctor, requireVerifiedDoctor, getDoctorChatsController);

router.get(
  "/doctor/appointments/:appointmentId/messages",
  protectDoctor,
  requireVerifiedDoctor,
  getDoctorAppointmentMessagesController
);

router.post(
  "/doctor/appointments/:appointmentId/messages",
  protectDoctor,
  requireVerifiedDoctor,
  sendDoctorMessageController
);

router.patch(
  "/doctor/:chatId/read",
  protectDoctor,
  requireVerifiedDoctor,
  markDoctorChatReadController
);

export default router;