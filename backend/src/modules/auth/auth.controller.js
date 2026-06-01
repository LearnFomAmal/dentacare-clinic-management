import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";
import setAuthCookies from "../../shared/utils/setAuthCookies.js";
import clearAuthCookies from "../../shared/utils/clearAuthCookies.js";
import {
  validateRegisterInput,
  validateOtpInput,
  validateEmailOnly,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput
} from "./auth.validator.js";

import {
  registerRequestService,
  resendRegisterOtpService,
  verifyRegisterOtpService,
  loginService,
  forgotPasswordRequestService,
  forgotPasswordVerifyOtpService,
   refreshAccessTokenService,
   logoutService,
   logoutAllService,
   resendForgotPasswordOtpService,
   googleLoginService,
} from "./auth.service.js";

export const registerRequestController = asyncHandler(async (req, res) => {
  validateRegisterInput(req.body);

  await registerRequestService(req.body);

  sendResponse(res, 200,true,"OTP sent to email");
});

export const resendRegisterOtpController = asyncHandler(async (req, res) => {

  const { email } = req.body;
   validateEmailOnly(email);
  await resendRegisterOtpService(email);

  sendResponse(res, 200, true,"OTP resent successfully");
});

export const verifyRegisterOtpController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  validateOtpInput(email, otp);

  await verifyRegisterOtpService(email, otp);
 
  sendResponse(res, 201, true, "Account created successfully. Please login.");
});

export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  validateLoginInput(email, password);

  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.connection.remoteAddress || "";

  const { accessToken, refreshToken, userData } = await loginService(
    email,
    password,
    userAgent,
    ipAddress
  );

  setAuthCookies(
    res,
    accessToken,
    refreshToken,
    "patient"
  );

  sendResponse(res, 200, true, "Login successful", userData);
});

export const forgotPasswordRequestController = asyncHandler(async (req, res) => {
  const { email } = req.body;

  validateForgotPasswordInput(email);

  await forgotPasswordRequestService(email);

  sendResponse(res, 200, true, "OTP sent for password reset");
});

export const resendForgotPasswordOtpController = asyncHandler(
  async (req, res) => {
    const { email } = req.body;

    validateForgotPasswordInput(email);

    await resendForgotPasswordOtpService(email);

    sendResponse(res, 200, true, "OTP resent successfully");
  }
);

export const forgotPasswordVerifyOtpController = asyncHandler(async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  validateResetPasswordInput(email, otp, newPassword, confirmPassword);

  await forgotPasswordVerifyOtpService(email, otp, newPassword);

  sendResponse(res, 200, true, "Password reset successful. Please login.");
});


export const refreshTokenController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.patientRefreshToken;

  const { newAccessToken, newRefreshToken } =
    await refreshAccessTokenService(refreshToken);

  setAuthCookies(
    res,
    newAccessToken,
    newRefreshToken,
    "patient"
  );

  sendResponse(res, 200, true, "Access token refreshed");
});

export const logoutController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.patientRefreshToken;

  await logoutService(refreshToken);

  clearAuthCookies(res, "patient");

  sendResponse(res, 200, true, "Logged out successfully");
});

export const logoutAllController = asyncHandler(async (req, res) => {
  await logoutAllService(req.user.userId);

  clearAuthCookies(res, "patient");

  sendResponse(res, 200, true, "Logged out from all devices");
});

export const googleLoginController = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.connection.remoteAddress || "";

  const { accessToken, refreshToken, userData } =
    await googleLoginService({
      credential,
      userAgent,
      ipAddress,
    });

  setAuthCookies(res, accessToken, refreshToken, "patient");

  sendResponse(
    res,
    200,
    true,
    "Google login successful",
    userData
  );
});