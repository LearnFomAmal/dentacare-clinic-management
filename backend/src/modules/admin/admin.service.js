import AppError from "../../shared/errors/AppError.js";
import {
  compareOtp,
  hashOtp,
} from "../../shared/utils/hashOtp.js";
import {
  hashPassword,
  comparePassword,
} from "../../shared/utils/passwordHash.js";
import {
  sendOtpMail,
} from "../../config/mailer.js";

import {
  findAdminByEmail,
  findAdminByEmailWithPassword,
  findAdminById,
} from "./admin.repository.js";

import otpGenerator from "../../shared/utils/otpGenerator.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/utils/generateToken.js";

import {
  createSession,
  revokeSessionByRefreshToken,
  revokeAllSessionsByUserId,
  countActiveSessionsByUserId,
  revokeOldestSessionByUserId,
} from "../auth/session.repository.js";


// ==============================
// ADMIN LOGIN
// ==============================
export const adminLoginService = async (
  email,
  password,
  userAgent,
  ipAddress
) => {
  const admin =
    await findAdminByEmailWithPassword(email);

  if (!admin) {
    throw new AppError(
      "Invalid email or password",
      400
    );
  }

  if (admin.accountStatus.isBlocked) {
    throw new AppError(
      "Admin account blocked",
      403
    );
  }

  const isPasswordMatched =
    await comparePassword(
      password,
      admin.password
    );

  if (!isPasswordMatched) {
    throw new AppError(
      "Invalid email or password",
      400
    );
  }

  const accessToken = generateAccessToken({
    adminId: admin._id,
    role: "admin",
  });

  const refreshToken = generateRefreshToken({
    adminId: admin._id,
    role: "admin",
  });

  const activeSessions =
    await countActiveSessionsByUserId(admin._id);

  if (activeSessions >= 5) {
    await revokeOldestSessionByUserId(
      admin._id
    );
  }

  await createSession({
    userId: admin._id,
    userType: "admin",
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt: new Date(
      Date.now() +
        7 * 24 * 60 * 60 * 1000
    ),
  });

  const adminData = {
    _id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  };

  return {
    accessToken,
    refreshToken,
    adminData,
  };
};


// ==============================
// ADMIN LOGOUT
// ==============================
export const adminLogoutService =
  async (refreshToken) => {
    if (!refreshToken) {
      throw new AppError(
        "No active session found",
        400
      );
    }

    await revokeSessionByRefreshToken(
      refreshToken
    );
  };


// ==============================
// GET CURRENT ADMIN
// ==============================
export const getCurrentAdminService =
  async (adminId) => {
    const admin =
      await findAdminById(adminId);

    if (!admin) {
      throw new AppError(
        "Admin not found",
        404
      );
    }

    return admin;
  };


// ==============================
// FORGOT PASSWORD
// ==============================
export const forgotAdminPasswordService =
  async (email) => {
    const admin =
      await findAdminByEmail(email);

    if (!admin) {
      throw new AppError(
        "Admin not found",
        404
      );
    }

    const otp = otpGenerator();
    const hashedOtp =
      await hashOtp(otp);

    admin.forgotPasswordOtp =
      hashedOtp;

    admin.forgotPasswordOtpExpire =
      new Date(
        Date.now() +
          5 * 60 * 1000
      );

    admin.forgotPasswordOtpVerified =
      false;

    await admin.save();

    await sendOtpMail(email, otp);

    return true;
  };


// ==============================
// VERIFY FORGOT OTP
// ==============================
export const verifyForgotOtpService =
  async (email, otp) => {
    const admin =
      await findAdminByEmail(email)
        .select(
          "+forgotPasswordOtp +forgotPasswordOtpExpire"
        );

    if (!admin) {
      throw new AppError(
        "Admin not found",
        404
      );
    }

    if (
      !admin.forgotPasswordOtp ||
      !admin.forgotPasswordOtpExpire
    ) {
      throw new AppError(
        "OTP not found",
        404
      );
    }

    if (
      admin.forgotPasswordOtpExpire <
      new Date()
    ) {
      throw new AppError(
        "OTP expired",
        400
      );
    }

    const isValid =
      await compareOtp(
        otp,
        admin.forgotPasswordOtp
      );

    if (!isValid) {
      throw new AppError(
        "Invalid OTP",
        400
      );
    }

    admin.forgotPasswordOtpVerified =
      true;

    await admin.save();

    return true;
  };


// ==============================
// RESET PASSWORD
// ==============================
export const resetAdminPasswordService =
  async (
    email,
    newPassword
  ) => {
    const admin =
      await findAdminByEmail(email)
        .select(
          "+forgotPasswordOtpVerified"
        );

    if (!admin) {
      throw new AppError(
        "Admin not found",
        404
      );
    }

    if (
      !admin.forgotPasswordOtpVerified
    ) {
      throw new AppError(
        "OTP not verified",
        400
      );
    }

    admin.password =
      await hashPassword(
        newPassword
      );

    admin.forgotPasswordOtp =
      undefined;
    admin.forgotPasswordOtpExpire =
      undefined;
    admin.forgotPasswordOtpVerified =
      undefined;

    await admin.save();

    await revokeAllSessionsByUserId(
      admin._id
    );

    return true;
  };


// ==============================
// RESEND OTP
// ==============================
export const resendForgotOtpService =
  async (email) => {
    const admin =
      await findAdminByEmail(email);

    if (!admin) {
      throw new AppError(
        "Admin not found",
        404
      );
    }

    const otp = otpGenerator();

    const hashedOtp =
      await hashOtp(otp);

    admin.forgotPasswordOtp =
      hashedOtp;

    admin.forgotPasswordOtpExpire =
      new Date(
        Date.now() +
          5 * 60 * 1000
      );

    admin.forgotPasswordOtpVerified =
      false;

    await admin.save();

    await sendOtpMail(email, otp);

    return true;
  };