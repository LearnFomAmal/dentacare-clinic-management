import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";
import clearAuthCookies from "../../shared/utils/clearAuthCookies.js";

import {
  getMyProfileService,
  updateMyProfileService,
  changePasswordService,
  deleteMyAccountService,
  getMySessionInfoService,
  updateThemeService,
} from "./user.service.js";

import {
  validateUpdateProfileInput,
  validateChangePasswordInput,
  validateThemeInput,
} from "./user.validator.js";


// GET PROFILE
export const getMyProfileController = asyncHandler(async (req, res) => {
  const user = await getMyProfileService(req.user.userId);

  sendResponse(res, 200, true, "Profile fetched", user);
});


// UPDATE PROFILE
export const updateMyProfileController = asyncHandler(async (req, res) => {
  validateUpdateProfileInput(req.body);

  const updatedUser = await updateMyProfileService(
    req.user.userId,
    req.body
  );

  sendResponse(res, 200, true, "Profile updated", updatedUser);
});


// CHANGE PASSWORD
export const changePasswordController = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  validateChangePasswordInput(currentPassword, newPassword, confirmPassword);

  await changePasswordService(
    req.user.userId,
    currentPassword,
    newPassword
  );

  clearAuthCookies(res);

  sendResponse(res, 200, true, "Password changed. Please login again.");
});


// DELETE ACCOUNT
export const deleteMyAccountController = asyncHandler(async (req, res) => {
  await deleteMyAccountService(req.user.userId);

  clearAuthCookies(res);

  sendResponse(res, 200, true, "Account deleted successfully");
});


// SESSION INFO
export const getMySessionsController = asyncHandler(async (req, res) => {
  const data = await getMySessionInfoService(req.user.userId);

  sendResponse(res, 200, true, "Session data fetched", data);
});


// UPDATE THEME
export const updateThemeController = asyncHandler(async (req, res) => {
  const { theme } = req.body;

  validateThemeInput(theme);

  const data = await updateThemeService(req.user.userId, theme);

  sendResponse(res, 200, true, "Theme updated", data);
});