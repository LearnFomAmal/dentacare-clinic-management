import AppError from "../../shared/errors/AppError.js";
import  generateOtp  from "../../shared/utils/otpGenerator.js";
import { hashPassword, comparePassword } from "../../shared/utils/passwordHash.js";
import { sendOtpMail } from "../../config/mailer.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/utils/generateToken.js";

import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

import {
  findSessionByRefreshToken,
  revokeSessionByRefreshToken,
  revokeAllSessionsByUserId,
  createSession,
  updateSessionRefreshToken,
  countActiveSessionsByUserId,
  revokeOldestSessionByUserId,
} from "./session.repository.js";

import {
  findUserByEmail,
  findUserByReferralCode,
  createUser,
  findUserByEmailWithPassword,
  updateUserPasswordByEmail,
  findUserById,
} from "../users/user.repository.js";
import {
  findOtpRecord,
  createOtpRecord,
  deleteOldOtps,
  updateOtpRecord,
} from "./auth.repository.js";


export const registerRequestService = async (data) => {
  const {
    username,
    email,
    password,
    dateOfBirth,
    gender,
    phoneNumber,
    bloodGroup,
    referralCode,
  } = data;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AppError("User already exists. Please login.", 400);
  }

  let referredBy = null;

  if (referralCode) {
    const referralUser = await findUserByReferralCode(referralCode);
    if (!referralUser) {
      throw new AppError("Invalid referral code", 400);
    }
    referredBy = referralUser._id;
  }

  await deleteOldOtps(email, "register");

  const otp = generateOtp();

  const hashedPassword = await hashPassword(password);

  await createOtpRecord({
    email,
    otp,
    purpose: "register",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    resendAvailableAt: new Date(Date.now() + 60 * 1000),

    tempUserData: {
      username,
      password: hashedPassword,
      dateOfBirth,
      gender,
      phoneNumber,
      bloodGroup,
      referredBy,
    },
  });

  await sendOtpMail(email, otp);
};

export const resendRegisterOtpService = async (email) => {
  const otpRecord = await findOtpRecord(email, "register");

  if (!otpRecord) {
    throw new AppError("No OTP request found", 404);
  }

  if (otpRecord.resendCount >= 5) {
    throw new AppError("Maximum resend limit reached", 400);
  }

  if (new Date() < otpRecord.resendAvailableAt) {
    throw new AppError("Please wait before requesting another OTP", 400);
  }

  const newOtp = generateOtp();

  otpRecord.otp = newOtp;
  otpRecord.resendCount += 1;
  otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  otpRecord.resendAvailableAt = new Date(Date.now() + 60 * 1000);

  await otpRecord.save();

  await sendOtpMail(email, newOtp);
};

export const verifyRegisterOtpService = async (email, enteredOtp) => {
  const otpRecord = await findOtpRecord(email, "register");

  if (!otpRecord) {
    throw new AppError("OTP not found", 404);
  }

  if (otpRecord.isUsed) {
    throw new AppError("OTP already used", 400);
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new AppError("OTP expired", 400);
  }

  if (otpRecord.attempts >= 5) {
    throw new AppError("Maximum OTP attempts exceeded. Please request new OTP.", 400);
  }

  if (otpRecord.otp !== enteredOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new AppError("Invalid OTP", 400);
  }

  const temp = otpRecord.tempUserData;
  otpRecord.isUsed = true;
  await otpRecord.save();
  await createUser({
    username: temp.username,
    email,
    password: temp.password,

    personalInfo: {
      dateOfBirth: temp.dateOfBirth,
      gender: temp.gender,
      phoneNumber: temp.phoneNumber,
      bloodGroup: temp.bloodGroup,
    },

    referral: {
      referralCode: `DENTA${Math.floor(1000 + Math.random() * 9000)}`,
      referredBy: temp.referredBy || null,
    },

    accountStatus: {
      isVerified: true,
    },
  });
 
  await deleteOldOtps(email, "register");
};
export const loginService = async (email, password, userAgent, ipAddress) => {
  const user = await findUserByEmailWithPassword(email);

  if (!user) {
    throw new AppError("Invalid email or password", 400);
  }

  if (user.accountStatus.isBlocked) {
    throw new AppError("Your account has been blocked by admin", 403);
  }

  if (user.accountStatus.isDeleted) {
  throw new AppError("This account has been deleted", 403);
 }

  if (!user.accountStatus.isVerified) {
    throw new AppError("Please verify your account first", 403);
  }

  const isPasswordMatched = await comparePassword(password, user.password);

  if (!isPasswordMatched) {
    throw new AppError("Invalid email or password", 400);
  }

  const accessToken = generateAccessToken({
    userId: user._id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id,
    role: user.role,
  });

const activeSessions = await countActiveSessionsByUserId(user._id);

if (activeSessions >= 5) {
  await revokeOldestSessionByUserId(user._id);
}

  await createSession({
    userId: user._id,
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const userData = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    profileImage: user.personalInfo.profileImage,
    theme: user.settings.theme,
  };

  return { accessToken, refreshToken, userData };
};

export const forgotPasswordRequestService = async (email) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("No account found with this email", 404);
  }

  if (user.accountStatus.isDeleted) {
  throw new AppError("This account has been deleted", 403);
}

  await deleteOldOtps(email, "forgot_password");

  const otp = generateOtp();

  await createOtpRecord({
    email,
    otp,
    purpose: "forgot_password",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    resendAvailableAt: new Date(Date.now() + 60 * 1000),
  });

  await sendOtpMail(email, otp);
};


export const forgotPasswordVerifyOtpService = async (email, enteredOtp, newPassword) => {
  const otpRecord = await findOtpRecord(email, "forgot_password");

  if (!otpRecord) {
    throw new AppError("OTP not found", 404);
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new AppError("OTP expired", 400);
  }

  if (otpRecord.attempts >= 5) {
    throw new AppError("Maximum OTP attempts exceeded. Please request new OTP.", 400);
  }

  if (otpRecord.otp !== enteredOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new AppError("Invalid OTP", 400);
  }
  otpRecord.isUsed = true;
 await otpRecord.save();
  const hashedPassword = await hashPassword(newPassword);


  await updateUserPasswordByEmail(email, hashedPassword);
  const user = await findUserByEmail(email);
  await revokeAllSessionsByUserId(user._id);

  await deleteOldOtps(email, "forgot_password");
};

export const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }

    const user = await findUserById(decoded.userId);

if (!user || user.accountStatus.isDeleted) {
  throw new AppError("User account no longer available", 401);
}

if (user.accountStatus.isBlocked) {
  throw new AppError("User account blocked", 401);
}
  const session = await findSessionByRefreshToken(refreshToken);

   if (new Date() > session.expiresAt) {
  throw new AppError("Session expired. Please login again.", 401);
}

  if (!session) {
    throw new AppError("Session expired. Please login again.", 401);
  }

  if (session.userId.toString() !== decoded.userId) {
  throw new AppError("Session mismatch", 401);
}
  const newAccessToken = generateAccessToken({
    userId: decoded.userId,
    role: decoded.role,
  });

  const newRefreshToken = generateRefreshToken({
    userId: decoded.userId,
    role: decoded.role,
  });

  await updateSessionRefreshToken(refreshToken, newRefreshToken);

  return { newAccessToken, newRefreshToken };
};

export const logoutService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("No active session found", 400);
  }

  await revokeSessionByRefreshToken(refreshToken);
};

export const logoutAllService = async (userId) => {
  await revokeAllSessionsByUserId(userId);
};