import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import setAuthCookies from "../../shared/utils/setAuthCookies.js";
import clearAuthCookies from "../../shared/utils/clearAuthCookies.js";

import {
  validateAdminLoginInput,
  validateForgotPasswordInput,
  validateVerifyOtpInput,
  validateResetPasswordInput,
} from "./admin.validator.js";

import {
  adminLoginService,
  adminLogoutService,
  getCurrentAdminService,
  forgotAdminPasswordService,
  verifyForgotOtpService,
  resetAdminPasswordService,
  resendForgotOtpService,
  refreshAdminTokenService,
} from "./admin.service.js";


// ==============================
// ADMIN LOGIN
// ==============================
export const adminLoginController =
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    validateAdminLoginInput(
      email,
      password
    );

    const userAgent =
      req.headers["user-agent"] || "";

    const ipAddress =
      req.ip ||
      req.connection.remoteAddress ||
      "";

    const {
      accessToken,
      refreshToken,
      adminData,
    } = await adminLoginService(
      email,
      password,
      userAgent,
      ipAddress
    );

   setAuthCookies(
  res,
  accessToken,
  refreshToken,
  "admin"
  );

    sendResponse(
      res,
      200,
      true,
      "Admin login successful",
      adminData
    );
  });


// ==============================
// ADMIN LOGOUT
// ==============================
export const adminLogoutController =
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.adminRefreshToken;

    await adminLogoutService(refreshToken);

    clearAuthCookies(res, "admin");

    sendResponse(
      res,
      200,
      true,
      "Admin logout successful"
    );
  });


// ==============================
// GET CURRENT ADMIN
// ==============================
export const getCurrentAdminController =
  asyncHandler(async (req, res) => {
    const admin =
      await getCurrentAdminService(
        req.admin.adminId
      );

    sendResponse(
      res,
      200,
      true,
      "Admin fetched successfully",
      admin
    );
  });


// ==============================
// FORGOT PASSWORD
// ==============================
export const forgotPasswordController =
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    validateForgotPasswordInput(email);

    await forgotAdminPasswordService(
      email
    );

    sendResponse(
      res,
      200,
      true,
      "OTP sent successfully"
    );
  });


// ==============================
// VERIFY OTP
// ==============================
export const verifyForgotOtpController =
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    validateVerifyOtpInput(
      email,
      otp
    );

    await verifyForgotOtpService(
      email,
      otp
    );

    sendResponse(
      res,
      200,
      true,
      "OTP verified successfully"
    );
  });


// ==============================
// RESET PASSWORD
// ==============================
export const resetAdminPasswordController =
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    validateResetPasswordInput(email, password);

    await resetAdminPasswordService(email, password);

    clearAuthCookies(res, "admin");

    sendResponse(
      res,
      200,
      true,
      "Password reset successful"
    );
  });


// ==============================
// RESEND OTP
// ==============================
export const resendForgotOtpController =
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    validateForgotPasswordInput(email);

    await resendForgotOtpService(
      email
    );

    sendResponse(
      res,
      200,
      true,
      "OTP resent successfully"
    );
  });

  export const refreshAdminTokenController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.adminRefreshToken;

  const data = await refreshAdminTokenService(refreshToken);

  setAuthCookies(
    res,
    data.accessToken,
    data.refreshToken,
    "admin"
  );

  sendResponse(
    res,
    200,
    true,
    "Admin token refreshed successfully"
  );
});