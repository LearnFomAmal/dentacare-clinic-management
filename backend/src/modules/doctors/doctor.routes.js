import express from "express";

import {
  createDoctorController,
  doctorLoginController,
  getMyDoctorProfileController,
  updateDoctorProfileController,
  changeDoctorPasswordController,
  doctorLogoutController,
  deleteDoctorAccountController,
  getDoctorSessionsController,
  updateDoctorThemeController,
  getAllDoctorsController,
  blockDoctorController,
  unblockDoctorController,
  verifyDoctorAccountController,
  refreshDoctorTokenController,
  resendDoctorVerificationOtpController,
  forgotDoctorPasswordController,
 resetDoctorPasswordController,
 resendForgotPasswordOtpController,
 getDoctorDetailsController,
  updateDoctorConsultationFeeController,
} from "./doctor.controller.js";

import { protectDoctor } from "../../middlewares/doctorAuth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";
const router = express.Router();


// ==============================
// ADMIN ROUTES
// ==============================
router.post("/",protectAdmin, createDoctorController);

router.get("/", protectAdmin,getAllDoctorsController);

router.patch("/:id/block", protectAdmin, blockDoctorController);

router.patch("/:id/unblock",protectAdmin,unblockDoctorController);

router.post(
  "/verify-account",
  verifyDoctorAccountController
);

router.post(
  "/resend-verification-otp",
  resendDoctorVerificationOtpController
);

router.patch(
  "/:id/consultation-fee",
  protectAdmin,
  updateDoctorConsultationFeeController
);
// ==============================
// DOCTOR AUTH
// ==============================
router.post("/login", doctorLoginController);

router.post("/logout", protectDoctor, doctorLogoutController);

router.post(
  "/refresh-token",
  refreshDoctorTokenController
);
// ==============================
// DOCTOR PROFILE
// ==============================
router.get("/me", protectDoctor, getMyDoctorProfileController);

router.patch("/me", protectDoctor, updateDoctorProfileController);

router.delete(
  "/me",
  protectDoctor,
  deleteDoctorAccountController
);


// ==============================
// DOCTOR PASSWORD
// ==============================
router.patch(
  "/change-password",
  protectDoctor,
  changeDoctorPasswordController
);


// ==============================
// DOCTOR SETTINGS
// ==============================
router.patch(
  "/theme",
  protectDoctor,
  updateDoctorThemeController
);


// ==============================
// DOCTOR SESSIONS
// ==============================
router.get(
  "/sessions",
  protectDoctor,
  getDoctorSessionsController
);


router.post(
  "/forgot-password",
  forgotDoctorPasswordController
);

router.post(
  "/reset-password",
  resetDoctorPasswordController
);

router.post(
  "/resend-forgot-password-otp",
  resendForgotPasswordOtpController
);

router.get(
  "/:id",
  protectAdmin,
  getDoctorDetailsController
);

export default router;