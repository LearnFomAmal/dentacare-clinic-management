import AppError from "../../shared/errors/AppError.js";
import { OAuth2Client } from "google-auth-library";
import  generateOtp  from "../../shared/utils/otpGenerator.js";
import { hashPassword, comparePassword } from "../../shared/utils/passwordHash.js";
import {compareOtp } from "../../shared/utils/hashOtp.js";
import { sendOtpMail } from "../../config/mailer.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/utils/generateToken.js";

import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  createReferralAfterRegistration,
  generateUniqueReferralCode,
  validateReferralCodeForRegistration,
} from "../referrals/referral.service.js";
import {
  findUserByEmail,
  findUserByReferralCode,
  createUser,
  findUserByEmailWithPassword,
  updateUserPasswordByEmail,
  findUserById,
  findUserByGoogleId,
  findActiveUserByEmail,
  updateUserById,
} from "../users/user.repository.js";

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
  findOtpRecord,
  createOtpRecord,
  deleteOldOtps,
} from "./auth.repository.js";

import { hashOtp } from "../../shared/utils/hashOtp.js";
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);



const isPatientProfileComplete = (user) => {
  return Boolean(
    user?.username &&
      user?.email &&
      user?.personalInfo?.dateOfBirth &&
      user?.personalInfo?.gender &&
      user?.personalInfo?.phoneNumber &&
      user?.personalInfo?.bloodGroup
  );
};

const buildUserData = (user) => {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: "patient",
    authProvider: user.authProvider || "local",
    profileImage: user.personalInfo?.profileImage || "",
    theme: user.settings?.theme || "light",
    isProfileComplete: isPatientProfileComplete(user),
    personalInfo: {
      dateOfBirth: user.personalInfo?.dateOfBirth || null,
      gender: user.personalInfo?.gender || "",
      phoneNumber: user.personalInfo?.phoneNumber || "",
      bloodGroup: user.personalInfo?.bloodGroup || "",
      profileImage: user.personalInfo?.profileImage || "",
    },
  };
};
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
let normalizedReferralCode = "";

if (referralCode && referralCode.trim()) {
  const referralUser = await validateReferralCodeForRegistration({
    referralCode,
    email,
  });

  referredBy = referralUser._id;
  normalizedReferralCode = referralUser.referral.referralCode;
}

  await deleteOldOtps(email, "register");
const otp = generateOtp();

const hashedOtp = await hashOtp(otp);


  const hashedPassword = await hashPassword(password);

  await createOtpRecord({
    email,
    otp: hashedOtp,
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
  referralCodeUsed: normalizedReferralCode,
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

  const hashedOtp = await hashOtp(newOtp);

  otpRecord.otp = hashedOtp;
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
  const isOtpMatched = await compareOtp(
  enteredOtp,
  otpRecord.otp
);

if (!isOtpMatched) {
   otpRecord.attempts += 1;
    await otpRecord.save();
   throw new AppError("Invalid OTP", 400);
}


  const temp = otpRecord.tempUserData;
  otpRecord.isUsed = true;
  await otpRecord.save();
  const newReferralCode = await generateUniqueReferralCode();

const user = await createUser({
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
    referralCode: newReferralCode,
    referredBy: temp.referredBy || null,
    hasCompletedFirstAppointment: false,
  },

  accountStatus: {
    isVerified: true,
    isBlocked: false,
    isDeleted: false,
  },
});

if (temp.referredBy) {
  await createReferralAfterRegistration({
    referrerId: temp.referredBy,
    referredUserId: user._id,
    referralCode: temp.referralCodeUsed,
  });
}
 
  await deleteOldOtps(email, "register");
};
export const loginService = async (email, password, userAgent, ipAddress) => {
  const user = await findUserByEmailWithPassword(email);

  if (!user) {
    throw new AppError("Invalid email or password", 400);
  }

  if (user.authProvider === "google" && !user.password) {
  throw new AppError(
    "This account uses Google login. Please continue with Google.",
    400
  );
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
  role: "patient",
});

const refreshToken = generateRefreshToken({
  userId: user._id,
  role: "patient",
});

const activeSessions = await countActiveSessionsByUserId(
  user._id,
  "user"
);

if (activeSessions >= 5) {
  await revokeOldestSessionByUserId(user._id, "user");
}

  await createSession({
    userId: user._id,
     userType: "user",
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

const userData = buildUserData(user);

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

const hashedOtp = await hashOtp(otp);


  await createOtpRecord({
    email,
    otp: hashedOtp,
    purpose: "forgot_password",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    resendAvailableAt: new Date(Date.now() + 60 * 1000),
  });

  await sendOtpMail(email, otp);
};

export const resendForgotPasswordOtpService = async (email) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("No account found with this email", 404);
  }

  if (user.accountStatus.isDeleted) {
    throw new AppError("This account has been deleted", 403);
  }

  if (user.accountStatus.isBlocked) {
    throw new AppError("This account has been blocked", 403);
  }

  const otpRecord = await findOtpRecord(email, "forgot_password");

  if (!otpRecord) {
    throw new AppError("No OTP request found", 404);
  }

  if (otpRecord.resendCount >= 3) {
    throw new AppError("Maximum resend limit reached", 400);
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

  const newOtp = generateOtp();
  const hashedOtp = await hashOtp(newOtp);

  otpRecord.otp = hashedOtp;
  otpRecord.attempts = 0;
  otpRecord.resendCount += 1;
  otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  otpRecord.resendAvailableAt = new Date(Date.now() + 60 * 1000);

  await otpRecord.save();

  await sendOtpMail(email, newOtp);
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
const isOtpMatched = await compareOtp(
  enteredOtp,
  otpRecord.otp
);


  if (!isOtpMatched) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new AppError("Invalid OTP", 400);
  }
  otpRecord.isUsed = true;
 await otpRecord.save();
   const user = await findUserByEmailWithPassword(email);
  const isSamePassword =
  await comparePassword(
    newPassword,
    user.password
  );

if (isSamePassword) {
  throw new AppError(
    "New password cannot be same as old password",
    400
  );
}
  const hashedPassword = await hashPassword(newPassword);
  

  await updateUserPasswordByEmail(email, hashedPassword);


 await revokeAllSessionsByUserId(user._id, "user");

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
if (decoded.role !== "patient") {
  throw new AppError("Invalid token role", 403);
}

const session = await findSessionByRefreshToken(refreshToken);

if (!session) {
  throw new AppError(
    "Session expired. Please login again.",
    401
  );
}

if (session.userType !== "user") {
  throw new AppError("Invalid session type", 401);
}

if (new Date() > session.expiresAt) {
  throw new AppError("Session expired. Please login again.", 401);
}

if (session.userId.toString() !== decoded.userId.toString()) {
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
  await revokeAllSessionsByUserId(userId, "user");
};

export const googleLoginService = async ({
  credential,
  userAgent,
  ipAddress,
}) => {
  if (!credential) {
    throw new AppError("Google credential is required", 400);
  }

  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new AppError("Invalid Google credential", 401);
  }

  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new AppError("Google email not found", 400);
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const username =
    payload.name ||
    email.split("@")[0];

  let user =
    (await findUserByGoogleId(googleId)) ||
    (await findActiveUserByEmail(email));

  if (user) {
    if (user.accountStatus?.isBlocked) {
      throw new AppError("Your account has been blocked by admin", 403);
    }

    if (user.accountStatus?.isDeleted) {
      throw new AppError("This account has been deleted", 403);
    }

    const updatePayload = {};

    if (!user.googleId) {
      updatePayload.googleId = googleId;
    }


if (!user.authProvider) {
  updatePayload.authProvider = user.password ? "local" : "google";
}

    if (!user.personalInfo?.profileImage && payload.picture) {
      updatePayload["personalInfo.profileImage"] = payload.picture;
    }

    if (Object.keys(updatePayload).length > 0) {
      user = await updateUserById(user._id, updatePayload);
    }
  } else {
    user = await createUser({
      username,
      email,
      authProvider: "google",
      googleId,
      role: "patient",

      personalInfo: {
        dateOfBirth: null,
        gender: "",
        phoneNumber: "",
        bloodGroup: "",
        profileImage: payload.picture || "",
      },

     referral: {
    referralCode: await generateUniqueReferralCode(),
    referredBy: null,
    hasCompletedFirstAppointment: false,
},

      accountStatus: {
        isVerified: true,
        isBlocked: false,
        isDeleted: false,
      },
    });
  }

  const accessToken = generateAccessToken({
    userId: user._id,
    role: "patient",
  });

  const refreshToken = generateRefreshToken({
    userId: user._id,
    role: "patient",
  });

  const activeSessions = await countActiveSessionsByUserId(
    user._id,
    "user"
  );

  if (activeSessions >= 5) {
    await revokeOldestSessionByUserId(user._id, "user");
  }

  await createSession({
    userId: user._id,
    userType: "user",
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken,
    refreshToken,
    userData: buildUserData(user),
  };
};