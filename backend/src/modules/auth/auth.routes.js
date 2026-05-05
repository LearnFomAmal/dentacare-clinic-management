import express from "express";
import {
  registerRequestController,
  resendRegisterOtpController,
  verifyRegisterOtpController,
  loginController,
  forgotPasswordRequestController,
  forgotPasswordVerifyOtpController,
  refreshTokenController,
 logoutController,
 logoutAllController,
} from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/register", registerRequestController);
router.post("/register/resend-otp", resendRegisterOtpController);
router.post("/register/verify-otp", verifyRegisterOtpController);
router.post("/login", loginController);
router.post("/forgot-password", forgotPasswordRequestController);
router.post("/forgot-password/verify-otp", forgotPasswordVerifyOtpController);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", logoutController);
router.post("/logout-all", protect, logoutAllController);

export default router;