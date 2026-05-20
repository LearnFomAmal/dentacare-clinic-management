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
  getAllPatientsService,
  getPatientDetailsService,
  blockUserService,
  unblockUserService,
  updatePatientProfileImageService,
} from "./user.service.js";

import {
  validateUpdateProfileInput,
  validateChangePasswordInput,
  validateThemeInput,
} from "./user.validator.js";


// ==============================
// PATIENT: GET PROFILE
// ==============================
export const getMyProfileController = asyncHandler(async (req, res) => {
  const user = await getMyProfileService(req.user.userId);

  sendResponse(res, 200, true, "Profile fetched", user);
});


// ==============================
// PATIENT: UPDATE PROFILE
// ==============================
export const updateMyProfileController = asyncHandler(async (req, res) => {
  validateUpdateProfileInput(req.body);

  const updatedUser = await updateMyProfileService(
    req.user.userId,
    req.body
  );

  sendResponse(res, 200, true, "Profile updated", updatedUser);
});


// ==============================
// PATIENT: CHANGE PASSWORD
// ==============================
export const changePasswordController = asyncHandler(async (req, res) => {
  const {
    currentPassword,
    newPassword,
    confirmPassword,
  } = req.body;

  validateChangePasswordInput(
    currentPassword,
    newPassword,
    confirmPassword
  );

  await changePasswordService(
    req.user.userId,
    currentPassword,
    newPassword
  );

 clearAuthCookies(res, "patient");

  sendResponse(
    res,
    200,
    true,
    "Password changed. Please login again."
  );
});


// ==============================
// PATIENT: DELETE ACCOUNT
// ==============================
export const deleteMyAccountController = asyncHandler(async (req, res) => {
  await deleteMyAccountService(req.user.userId);

 clearAuthCookies(res, "patient");

  sendResponse(
    res,
    200,
    true,
    "Account deleted successfully"
  );
});


// ==============================
// PATIENT: SESSION INFO
// ==============================
export const getMySessionsController = asyncHandler(async (req, res) => {
  const data = await getMySessionInfoService(req.user.userId);

  sendResponse(
    res,
    200,
    true,
    "Session data fetched",
    data
  );
});


// ==============================
// PATIENT: UPDATE THEME
// ==============================
export const updateThemeController = asyncHandler(async (req, res) => {
  const { theme } = req.body;

  validateThemeInput(theme);

  const data = await updateThemeService(
    req.user.userId,
    theme
  );

  sendResponse(
    res,
    200,
    true,
    "Theme updated",
    data
  );
});


// ==============================
// ADMIN: GET ALL PATIENTS
// ==============================
export const getAllPatientsController = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search || "",
    status: req.query.status || "",
  };

  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: req.query.sortBy || "createdAt",
    order: req.query.order || "desc",
  };

  const result = await getAllPatientsService(
    filters,
    options
  );

  sendResponse(
    res,
    200,
    true,
    "Patients fetched successfully",
    result
  );
});


// ==============================
// ADMIN: GET PATIENT DETAILS
// ==============================
export const getPatientDetailsController = asyncHandler(async (req, res) => {
  const patientId = req.params.id;

  const patient = await getPatientDetailsService(patientId);

  sendResponse(
    res,
    200,
    true,
    "Patient details fetched successfully",
    patient
  );
});


// ==============================
// ADMIN: BLOCK PATIENT
// ==============================
export const blockUserController = asyncHandler(async (req, res) => {
  const result = await blockUserService(req.params.id);

  sendResponse(
    res,
    200,
    true,
    "User blocked successfully",
    result
  );
});


// ==============================
// ADMIN: UNBLOCK PATIENT
// ==============================
export const unblockUserController = asyncHandler(async (req, res) => {
  const result = await unblockUserService(req.params.id);

  sendResponse(
    res,
    200,
    true,
    "User unblocked successfully",
    result
  );
});

export const updatePatientProfileImageController = asyncHandler(
  async (req, res) => {
    const updatedUser = await updatePatientProfileImageService(
      req.user.userId,
      req.file
    );

    sendResponse(
      res,
      200,
      true,
      "Profile image updated successfully",
      updatedUser
    );
  }
);