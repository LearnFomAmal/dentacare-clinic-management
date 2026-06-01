import AppError from "../../shared/errors/AppError.js";
import { comparePassword, hashPassword } from "../../shared/utils/passwordHash.js";



import {
  findUserById,
  updateUserById,
  softDeleteUserById,
  findPatientByIdForAdmin,
  getAllPatients,
  blockUserById,
  unblockUserById,
  updateUserProfileImageById,
} from "./user.repository.js";

import { uploadBufferToCloudinary } from "../../shared/utils/cloudinaryUpload.js";

import {
  revokeAllSessionsByUserId,
  countActiveSessionsByUserId,
 
} from "../auth/session.repository.js";

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

const sanitizeUserResponse = (user) => {
  const profileImage = user.personalInfo?.profileImage || "";

  return {
    _id: user._id,

    username: user.username,
    email: user.email,
    role: user.role,

    authProvider: user.authProvider || "local",
    profileImage,
    isProfileComplete: isPatientProfileComplete(user),

    personalInfo: {
      dateOfBirth: user.personalInfo?.dateOfBirth || null,
      gender: user.personalInfo?.gender || "",
      phoneNumber: user.personalInfo?.phoneNumber || "",
      bloodGroup: user.personalInfo?.bloodGroup || "",
      profileImage,
    },

    settings: {
      theme: user.settings?.theme || "light",
    },

    referral: {
      referralCode: user.referral?.referralCode || "",
      referredBy: user.referral?.referredBy || null,
      hasCompletedFirstAppointment:
        user.referral?.hasCompletedFirstAppointment || false,
    },

    accountStatus: {
      isVerified: user.accountStatus?.isVerified || false,
      isBlocked: user.accountStatus?.isBlocked || false,
      isDeleted: user.accountStatus?.isDeleted || false,
    },

    walletSummary: {
      balance: user.walletSummary?.balance || 0,
      totalEarned: user.walletSummary?.totalEarned || 0,
      totalSpent: user.walletSummary?.totalSpent || 0,
    },

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
// GET PROFILE
export const getMyProfileService = async (userId) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUserResponse(user);
};

// UPDATE PROFILE
export const updateMyProfileService = async (userId, payload) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  const allowedUpdate = {};

  if (payload.username !== undefined) allowedUpdate.username = payload.username;
  if (payload.personalInfo?.dateOfBirth !== undefined)
    allowedUpdate["personalInfo.dateOfBirth"] = payload.personalInfo.dateOfBirth;
  if (payload.personalInfo?.gender !== undefined)
    allowedUpdate["personalInfo.gender"] = payload.personalInfo.gender;
  if (payload.personalInfo?.phoneNumber !== undefined)
    allowedUpdate["personalInfo.phoneNumber"] = payload.personalInfo.phoneNumber;
  if (payload.personalInfo?.bloodGroup !== undefined)
    allowedUpdate["personalInfo.bloodGroup"] = payload.personalInfo.bloodGroup;
  if (payload.personalInfo?.profileImage !== undefined)
    allowedUpdate["personalInfo.profileImage"] = payload.personalInfo.profileImage;

  const updatedUser = await updateUserById(userId, allowedUpdate);

  return sanitizeUserResponse(updatedUser);
};

// CHANGE PASSWORD
export const changePasswordService = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await findUserById(userId).select("+password");

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  if (user.authProvider === "google" && !user.password) {
    throw new AppError(
      "Password change is not available for Google login accounts",
      400
    );
  }

  if (!user.password) {
    throw new AppError(
      "Password is not set for this account",
      400
    );
  }

  const isSamePassword = await comparePassword(
    newPassword,
    user.password
  );

  if (isSamePassword) {
    throw new AppError(
      "New password must be different from current password",
      400
    );
  }

  const isMatch = await comparePassword(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await updateUserById(userId, {
    password: hashedPassword,
    authProvider: "local",
  });

  await revokeAllSessionsByUserId(user._id, "user");
};

// DELETE ACCOUNT
export const deleteMyAccountService = async (userId) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  await softDeleteUserById(userId);
await revokeAllSessionsByUserId(user._id, "user");
};

// ACTIVE SESSION COUNT
export const getMySessionInfoService = async (userId) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  const count = await countActiveSessionsByUserId(
  user._id,
  "user"
);

  return {
    activeSessions: count,
  };
};

// UPDATE THEME
export const updateThemeService = async (userId, theme) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  const updatedUser = await updateUserById(userId, {
    "settings.theme": theme,
  });

  return sanitizeUserResponse(updatedUser);
};

// ==============================
// ADMIN: GET ALL PATIENTS
// ==============================
export const getAllPatientsService = async (
  filters = {},
  options = {}
) => {
  return getAllPatients(filters, options);
};

const calculateAge = (dob) => {
  if (!dob) return null;

  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);

  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export const getPatientDetailsService = async (patientId) => {
  const patient = await findPatientByIdForAdmin(patientId);

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  return {
    _id: patient._id,

    username: patient.username,
    email: patient.email,
    role: patient.role,

    personalInfo: {
      dateOfBirth: patient.personalInfo?.dateOfBirth || null,
      gender: patient.personalInfo?.gender || "",
      phoneNumber: patient.personalInfo?.phoneNumber || "",
      bloodGroup: patient.personalInfo?.bloodGroup || "",
      profileImage: patient.personalInfo?.profileImage || "",
    },

    age: calculateAge(patient.personalInfo?.dateOfBirth),

    accountStatus: {
      isVerified: patient.accountStatus?.isVerified || false,
      isBlocked: patient.accountStatus?.isBlocked || false,
      isDeleted: patient.accountStatus?.isDeleted || false,
    },

    walletSummary: {
      balance: patient.walletSummary?.balance ?? 0,
      totalEarned: patient.walletSummary?.totalEarned ?? 0,
      totalSpent: patient.walletSummary?.totalSpent ?? 0,
    },

    referral: {
      referralCode: patient.referral?.referralCode || "",
      referredBy: patient.referral?.referredBy || null,
      hasCompletedFirstAppointment:
        patient.referral?.hasCompletedFirstAppointment || false,
    },

    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
};

// ==============================
// ADMIN BLOCK PATIENT
// ==============================
export const blockUserService = async (userId) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted || user.role !== "patient") {
    throw new AppError("User not found", 404);
  }

  await blockUserById(userId);
await revokeAllSessionsByUserId(user._id, "user");

  return {
    _id: userId,
    isBlocked: true,
  };
};

// ADMIN: UNBLOCK PATIENT
export const unblockUserService = async (userId) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted || user.role !== "patient") {
    throw new AppError("User not found", 404);
  }

  await unblockUserById(userId);

  return {
    _id: userId,
    isBlocked: false,
  };
};

export const updatePatientProfileImageService = async (
  userId,
  file
) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  if (!file) {
    throw new AppError("Profile image is required", 400);
  }

  const uploadResult = await uploadBufferToCloudinary({
    buffer: file.buffer,
    folder: "dentacare/patients",
    publicId: `patient_${user._id}`,
  });

  const cacheVersion = uploadResult.version || Date.now();

  const finalImageUrl = `${uploadResult.secure_url}?v=${cacheVersion}`;

  const updatedUser = await updateUserProfileImageById(
    user._id,
    finalImageUrl
  );

  return sanitizeUserResponse(updatedUser);
};