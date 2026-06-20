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
 updateDoctorProfileImageController,
 registerDoctorController,
 verifyDoctorRegisterOtpController,
  resendDoctorRegisterOtpController,
  getMyDoctorVerificationController,
 uploadDoctorVerificationDocumentsController,
 getDoctorVerificationRequestsController,
 approveDoctorVerificationController,
  rejectDoctorVerificationController,

} from "./doctor.controller.js";

import { protectDoctor} from "../../middlewares/doctorAuth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";
import {
  uploadProfileImage,
  uploadDoctorVerificationDocuments,
} from "../../middlewares/upload.middleware.js";

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
router.get("/me", protectDoctor,getMyDoctorProfileController);

router.patch("/me", protectDoctor,updateDoctorProfileController);

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

// ==============================
// DOCTOR SELF REGISTRATION
// ==============================
router.post("/register", registerDoctorController);

router.post(
  "/register/verify-otp",
  verifyDoctorRegisterOtpController
);

router.post(
  "/register/resend-otp",
  resendDoctorRegisterOtpController
);

// ==============================
// DOCTOR VERIFICATION DOCUMENTS
// ==============================
router.get(
  "/me/verification",
  protectDoctor,
  getMyDoctorVerificationController
);

router.patch(
  "/me/verification-documents",
  protectDoctor,
  uploadDoctorVerificationDocuments,
  uploadDoctorVerificationDocumentsController
);

// ==============================
// ADMIN DOCTOR VERIFICATION
// ==============================
router.get(
  "/admin/verification-requests",
  protectAdmin,
  getDoctorVerificationRequestsController
);

router.patch(
  "/admin/:id/verification/approve",
  protectAdmin,
  approveDoctorVerificationController
);

router.patch(
  "/admin/:id/verification/reject",
  protectAdmin,
  rejectDoctorVerificationController
);

router.patch(
  "/me/profile-image",
  protectDoctor,
  uploadProfileImage,
  updateDoctorProfileImageController
);

router.get(
  "/:id",
  protectAdmin,
  getDoctorDetailsController
);



export default router;