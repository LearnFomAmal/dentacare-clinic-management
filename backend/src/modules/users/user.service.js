import AppError from "../../shared/errors/AppError.js";
import { comparePassword, hashPassword } from "../../shared/utils/passwordHash.js";

import {
  findUserById,
  updateUserById,
  softDeleteUserById,
} from "./user.repository.js";

import {
  revokeAllSessionsByUserId,
  countActiveSessionsByUserId,
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

  await revokeAllSessionsByUserId(userId);
};

// DELETE ACCOUNT
export const deleteMyAccountService = async (userId) => {
  const user = await findUserById(userId);

  if (!user || user.accountStatus.isDeleted) {
    throw new AppError("User not found", 404);
  }

  await softDeleteUserById(userId);
  await revokeAllSessionsByUserId(userId);
};

// ACTIVE SESSION COUNT
export const getMySessionInfoService = async (userId) => {
  const count = await countActiveSessionsByUserId(userId);

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