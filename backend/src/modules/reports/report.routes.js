import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { protectDoctor } from "../../middlewares/doctorAuth.middleware.js";
import {
  uploadBookingReport,
  uploadDoctorPrescription,
} from "../../middlewares/upload.middleware.js";

import {
  deleteDraftReportController,
  getDoctorAppointmentReportsController,
  getMyDraftReportsController,
  getPatientAppointmentReportsController,
  uploadBookingReportController,
  uploadDoctorPrescriptionController,
} from "./report.controller.js";

const router = express.Router();

// ==============================
// PATIENT BOOKING REPORT ROUTES
// ==============================
router.post(
  "/booking-upload",
  protect,
  uploadBookingReport,
  uploadBookingReportController
);

router.get(
  "/drafts",
  protect,
  getMyDraftReportsController
);

router.delete(
  "/drafts/:reportId",
  protect,
  deleteDraftReportController
);

// ==============================
// DOCTOR PRESCRIPTION ROUTES
// ==============================
router.post(
  "/doctor/prescription/:appointmentId",
  protectDoctor,
  uploadDoctorPrescription,
  uploadDoctorPrescriptionController
);

// ==============================
// APPOINTMENT REPORT FETCH ROUTES
// ==============================
router.get(
  "/patient/appointment/:appointmentId",
  protect,
  getPatientAppointmentReportsController
);

router.get(
  "/doctor/appointment/:appointmentId",
  protectDoctor,
  getDoctorAppointmentReportsController
);

export default router;