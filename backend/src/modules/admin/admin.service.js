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
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  findAdminByEmail,
  findAdminByEmailWithPassword,
  findAdminById,
  updateAdminById,
} from "./admin.repository.js";

import generateOtp from "../../shared/utils/otpGenerator.js";

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
  findSessionByRefreshToken,
  updateSessionRefreshToken,
} from "../auth/session.repository.js";


import {
  createOtpRecord,
  findOtpRecord,
  deleteOldOtps,
} from "../auth/auth.repository.js";

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
  if (admin.accountStatus?.isDeleted) {
  throw new AppError("Admin account deleted", 403);
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
  await countActiveSessionsByUserId(admin._id, "admin");

if (activeSessions >= 5) {
  await revokeOldestSessionByUserId(
    admin._id,
    "admin"
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
// ==============================
// ADMIN FORGOT PASSWORD - SEND OTP
// ==============================
export const forgotAdminPasswordService = async (email) => {
  const admin = await findAdminByEmail(email);

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  if (admin.accountStatus?.isBlocked) {
    throw new AppError("Admin account blocked", 403);
  }

  await deleteOldOtps(email, "admin_forgot_password");

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  await createOtpRecord({
    email,
    otp: hashedOtp,
    purpose: "admin_forgot_password",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    resendAvailableAt: new Date(Date.now() + 60 * 1000),
  });

  await sendOtpMail(email, otp);
};


// ==============================
// ADMIN VERIFY FORGOT OTP
// ==============================
export const verifyForgotOtpService = async (email, otp) => {
  const otpRecord = await findOtpRecord(
    email,
    "admin_forgot_password"
  );

  if (!otpRecord) {
    throw new AppError("OTP not found", 404);
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new AppError("OTP expired", 400);
  }

  if (otpRecord.attempts >= 5) {
    throw new AppError("Maximum OTP attempts exceeded", 400);
  }

  const isOtpValid = await compareOtp(otp, otpRecord.otp);

  if (!isOtpValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    throw new AppError("Invalid OTP", 400);
  }

  otpRecord.isUsed = true;
  await otpRecord.save();
};


// ==============================
// ADMIN RESET PASSWORD
// ==============================
export const resetAdminPasswordService = async (
  email,
  newPassword
) => {
  const admin = await findAdminByEmail(email);

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  const verifiedOtp = await findOtpRecord(
    email,
    "admin_forgot_password"
  );

  if (!verifiedOtp || verifiedOtp.isUsed !== true) {
    throw new AppError("OTP not verified", 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await updateAdminById(admin._id, {
    password: hashedPassword,
  });

  await revokeAllSessionsByUserId(admin._id, "admin");
  
  await deleteOldOtps(email, "admin_forgot_password");
};


// ==============================
// ADMIN RESEND FORGOT OTP
// ==============================
export const resendForgotOtpService = async (email) => {
  const admin = await findAdminByEmail(email);

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  if (admin.accountStatus?.isBlocked) {
    throw new AppError("Admin account blocked", 403);
  }

  const otpRecord = await findOtpRecord(
    email,
    "admin_forgot_password"
  );

  if (!otpRecord) {
    throw new AppError("OTP record not found", 404);
  }

  if (new Date() < otpRecord.resendAvailableAt) {
    const secondsLeft = Math.ceil(
      (otpRecord.resendAvailableAt - new Date()) / 1000
    );

    throw new AppError(
      `Please wait ${secondsLeft}s before requesting another OTP`,
      400
    );
  }

  if (otpRecord.resendCount >= 5) {
    throw new AppError("Maximum resend limit exceeded", 400);
  }

  const newOtp = generateOtp();
  const hashedOtp = await hashOtp(newOtp);

  otpRecord.otp = hashedOtp;
  otpRecord.attempts = 0;
  otpRecord.resendCount += 1;
  otpRecord.isUsed = false;
  otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  otpRecord.resendAvailableAt = new Date(Date.now() + 60 * 1000);

  await otpRecord.save();

  await sendOtpMail(email, newOtp);
};

export const refreshAdminTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  if (decoded.role !== "admin") {
    throw new AppError("Invalid token role", 403);
  }

  const session = await findSessionByRefreshToken(refreshToken);

  if (!session) {
    throw new AppError("Session expired", 401);
  }

  if (session.userType !== "admin") {
    throw new AppError("Invalid session type", 401);
  }

  if (new Date() > session.expiresAt) {
    throw new AppError("Session expired", 401);
  }

  const admin = await findAdminById(decoded.adminId);

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  if (admin.accountStatus?.isBlocked) {
    throw new AppError("Admin account blocked", 403);
  }

  if (admin.accountStatus?.isDeleted) {
    throw new AppError("Admin account deleted", 403);
  }

  if (session.userId.toString() !== admin._id.toString()) {
    throw new AppError("Session mismatch", 401);
  }

  const newAccessToken = generateAccessToken({
    adminId: admin._id,
    role: "admin",
  });

  const newRefreshToken = generateRefreshToken({
    adminId: admin._id,
    role: "admin",
  });

 const updatedSession = await updateSessionRefreshToken(
  refreshToken,
  newRefreshToken
);

if (!updatedSession) {
  throw new AppError("Session expired. Please login again.", 401);
}

return {
  accessToken: newAccessToken,
  refreshToken: newRefreshToken,
};
};