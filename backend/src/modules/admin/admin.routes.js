import express from "express";

import {
  adminLoginController,
  adminLogoutController,
  getCurrentAdminController,
  forgotPasswordController,
  verifyForgotOtpController,
  resetAdminPasswordController,
  resendForgotOtpController,
} from "./admin.controller.js";

import {
  protectAdmin,
} from "../../middlewares/adminAuth.middleware.js";

const router = express.Router();


// ==============================
// ADMIN AUTH
// ==============================
router.post(
  "/login",
  adminLoginController
);

router.post(
  "/logout",
  protectAdmin,
  adminLogoutController
);


// ==============================
// CURRENT ADMIN
// ==============================
router.get(
  "/me",
  protectAdmin,
  getCurrentAdminController
);


router.post("/forgot-password", forgotPasswordController);
router.post("/verify-forgot-otp", verifyForgotOtpController);
router.post("/reset-password", resetAdminPasswordController);
router.post("/resend-forgot-otp", resendForgotOtpController);


export default router;