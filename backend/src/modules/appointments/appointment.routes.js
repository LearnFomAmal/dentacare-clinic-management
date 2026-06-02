import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { protectDoctor } from "../../middlewares/doctorAuth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";

import {
  approveAppointmentByAdminController,
  approveAppointmentByDoctorController,
  cancelAppointmentByAdminController,
  cancelAppointmentByPatientController,
  completeAppointmentByDoctorController,
  getAdminAppointmentDetailsController,
  getAdminAppointmentsController,
  getDoctorAppointmentDetailsController,
  getDoctorAppointmentsController,
  getMyAppointmentsController,
  getPatientAppointmentDetailsController,
  initiateAppointmentController,
  rejectAppointmentByAdminController,
  rejectAppointmentByDoctorController,
  rescheduleAppointmentByPatientController,
} from "./appointment.controller.js";

const router = express.Router();

// ==============================
// PATIENT ROUTES
// ==============================
router.post("/initiate", protect, initiateAppointmentController);

router.get("/my", protect, getMyAppointmentsController);

router.get(
  "/my/:appointmentId",
  protect,
  getPatientAppointmentDetailsController
);

router.patch(
  "/my/:appointmentId/cancel",
  protect,
  cancelAppointmentByPatientController
);

router.patch(
  "/my/:appointmentId/reschedule",
  protect,
  rescheduleAppointmentByPatientController
);

// ==============================
// DOCTOR ROUTES
// ==============================
router.get("/doctor", protectDoctor, getDoctorAppointmentsController);

router.get(
  "/doctor/:appointmentId",
  protectDoctor,
  getDoctorAppointmentDetailsController
);

router.patch(
  "/doctor/:appointmentId/approve",
  protectDoctor,
  approveAppointmentByDoctorController
);

router.patch(
  "/doctor/:appointmentId/reject",
  protectDoctor,
  rejectAppointmentByDoctorController
);

router.patch(
  "/doctor/:appointmentId/complete",
  protectDoctor,
  completeAppointmentByDoctorController
);

// Doctor cancel intentionally removed.
// Emergency cancellation is patient/admin only.

// ==============================
// ADMIN ROUTES
// ==============================
router.get("/admin", protectAdmin, getAdminAppointmentsController);

router.get(
  "/admin/:appointmentId",
  protectAdmin,
  getAdminAppointmentDetailsController
);

router.patch(
  "/admin/:appointmentId/approve",
  protectAdmin,
  approveAppointmentByAdminController
);

router.patch(
  "/admin/:appointmentId/reject",
  protectAdmin,
  rejectAppointmentByAdminController
);

router.patch(
  "/admin/:appointmentId/cancel",
  protectAdmin,
  cancelAppointmentByAdminController
);

// ==============================
// BACKWARD COMPATIBLE PATIENT DETAIL ROUTE
// Keep this last because it is dynamic.
// ==============================
router.get(
  "/:appointmentId",
  protect,
  getPatientAppointmentDetailsController
);

export default router;