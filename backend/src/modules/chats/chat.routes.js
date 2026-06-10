import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { protectDoctor } from "../../middlewares/doctorAuth.middleware.js";

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
router.get("/doctor/my", protectDoctor, getDoctorChatsController);

router.get(
  "/doctor/appointments/:appointmentId/messages",
  protectDoctor,
  getDoctorAppointmentMessagesController
);

router.post(
  "/doctor/appointments/:appointmentId/messages",
  protectDoctor,
  sendDoctorMessageController
);

router.patch(
  "/doctor/:chatId/read",
  protectDoctor,
  markDoctorChatReadController
);

export default router;