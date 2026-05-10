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
} from "./user.repository.js";

import {
  revokeAllSessionsByUserId,
  countActiveSessionsByUserId,
  revokeOldestSessionByUserId,
} from "../auth/session.repository.js";

const sanitizeUserResponse = (user) => {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    personalInfo: user.personalInfo,
    theme: user.settings.theme,
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
export const changePasswordService = async (userId, currentPassword, newPassword) => {
  const user = await findUserById(userId).select("+password");

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await comparePassword(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await updateUserById(userId, { password: hashedPassword });

  await revokeAllSessionsByUserId(
  user._id,
  "user"
);
};

// DELETE ACCOUNT
export const deleteMyAccountService = async (userId) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  await softDeleteUserById(userId);
  await revokeOldestSessionByUserId(
  user._id,
  "user"
);
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

  return {
    theme: updatedUser.settings.theme,
  };
};

export const getAllPatientsService = async (filters, options) => {
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

    name: patient.username,

    email: patient.email,

    phone: patient.personalInfo?.phoneNumber || null,

    gender: patient.personalInfo?.gender || null,

    profileImage: patient.personalInfo?.profileImage || "",

    bloodGroup: patient.personalInfo?.bloodGroup || null,

    age: calculateAge(patient.personalInfo?.dateOfBirth),

    accountCreatedAt: patient.createdAt,

    accountStatus: patient.accountStatus,
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
  await revokeOldestSessionByUserId(
  user._id,
  "user"
);

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