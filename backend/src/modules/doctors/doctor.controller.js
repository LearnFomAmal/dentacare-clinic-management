import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import setAuthCookies from "../../shared/utils/setAuthCookies.js";
import clearAuthCookies from "../../shared/utils/clearAuthCookies.js";

import {
  validateCreateDoctorInput,
  validateDoctorLoginInput,
  validateDoctorProfileUpdateInput,
  validateDoctorChangePasswordInput,
  validateDoctorThemeInput,
  validateDoctorVerificationInput,
  validateDoctorResendOtpInput,
  validateDoctorForgotPasswordInput,
  validateDoctorResetPasswordInput,
 validateDoctorConsultationFeeInput,
} from "./doctor.validator.js";

import {
  createDoctorService,
  doctorLoginService,
  getMyDoctorProfileService,
  updateDoctorProfileService,
  changeDoctorPasswordService,
  doctorLogoutService,
  deleteDoctorAccountService,
  getDoctorSessionInfoService,
  updateDoctorThemeService,
  getAllDoctorsService,
  blockDoctorService,
  unblockDoctorService,
  verifyDoctorAccountService,
  refreshDoctorTokenService,
  resendDoctorVerificationOtpService,
  forgotDoctorPasswordService,
  resetDoctorPasswordService,
  resendForgotPasswordOtpService,
  getDoctorDetailsService,
 updateDoctorConsultationFeeService,
 updateDoctorProfileImageService,
} from "./doctor.service.js";


// ==============================
// ADMIN CREATE DOCTOR
// ==============================
export const createDoctorController = asyncHandler(async (req, res) => {
  validateCreateDoctorInput(req.body);

  const doctor = await createDoctorService(req.body);

  sendResponse(res, 201, true, "Doctor created successfully", doctor);
});


// ==============================
// DOCTOR LOGIN
// ==============================
export const doctorLoginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  validateDoctorLoginInput(email, password);

  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.connection.remoteAddress || "";

  const { accessToken, refreshToken, doctorData } =
    await doctorLoginService(
      email,
      password,
      userAgent,
      ipAddress
    );

  setAuthCookies(
  res,
  accessToken,
  refreshToken,
  "doctor"
);

  sendResponse(res, 200, true, "Doctor login successful", doctorData);
});


// ==============================
// GET MY PROFILE
// ==============================
export const getMyDoctorProfileController = asyncHandler(
  async (req, res) => {
    const doctor = await getMyDoctorProfileService(
      req.doctor.doctorId
    );

    sendResponse(res, 200, true, "Doctor profile fetched", doctor);
  }
);


// ==============================
// UPDATE PROFILE
// ==============================
export const updateDoctorProfileController = asyncHandler(
  async (req, res) => {
    validateDoctorProfileUpdateInput(req.body);

    const updatedDoctor =
      await updateDoctorProfileService(
        req.doctor.doctorId,
        req.body
      );

    sendResponse(
      res,
      200,
      true,
      "Doctor profile updated",
      updatedDoctor
    );
  }
);


// ==============================
// CHANGE PASSWORD
// ==============================
export const changeDoctorPasswordController = asyncHandler(
  async (req, res) => {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    validateDoctorChangePasswordInput(
      currentPassword,
      newPassword,
      confirmPassword
    );

    await changeDoctorPasswordService(
      req.doctor.doctorId,
      currentPassword,
      newPassword
    );

    clearAuthCookies(res,"doctor");

    sendResponse(
      res,
      200,
      true,
      "Password changed. Please login again."
    );
  }
);


// ==============================
// LOGOUT
// ==============================
export const doctorLogoutController = asyncHandler(
  async (req, res) => {
    const refreshToken = req.cookies?.doctorRefreshToken;

    await doctorLogoutService(refreshToken);

    clearAuthCookies(res, "doctor");

    sendResponse(
      res,
      200,
      true,
      "Doctor logged out successfully"
    );
  }
);

// ==============================
// DELETE ACCOUNT
// ==============================
export const deleteDoctorAccountController = asyncHandler(
  async (req, res) => {
    await deleteDoctorAccountService(req.doctor.doctorId);

    clearAuthCookies(res, "doctor");

    sendResponse(
      res,
      200,
      true,
      "Doctor account deleted successfully"
    );
  }
);


// ==============================
// ACTIVE SESSIONS
// ==============================
export const getDoctorSessionsController = asyncHandler(
  async (req, res) => {
    const data = await getDoctorSessionInfoService(
      req.doctor.doctorId
    );

    sendResponse(
      res,
      200,
      true,
      "Doctor session info fetched",
      data
    );
  }
);


// ==============================
// UPDATE THEME
// ==============================
export const updateDoctorThemeController = asyncHandler(
  async (req, res) => {
    const { theme } = req.body;

    validateDoctorThemeInput(theme);

    const data = await updateDoctorThemeService(
      req.doctor.doctorId,
      theme
    );

    sendResponse(
      res,
      200,
      true,
      "Theme updated successfully",
      data
    );
  }
);


// ==============================
// ADMIN GET ALL DOCTORS
// ==============================
export const getAllDoctorsController = asyncHandler(async (req, res) => {
  const filters = {
    specialization: req.query.specialization,
    experience: req.query.experience,
    rating: req.query.rating,
    fee: req.query.fee,
    search: req.query.search,
    status: req.query.status, // blocked/unblocked
  };

  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: req.query.sortBy || "createdAt",
    order: req.query.order || "desc",
  };

  const result = await getAllDoctorsService(filters, options);

  sendResponse(
    res,
    200,
    true,
    "Doctors fetched successfully",
    result
  );
});


// ==============================
// ADMIN BLOCK DOCTOR
// ==============================
export const blockDoctorController = asyncHandler(
  async (req, res) => {
    await blockDoctorService(req.params.id);

    sendResponse(
      res,
      200,
      true,
      "Doctor blocked successfully"
    );
  }
);


// ==============================
// ADMIN UNBLOCK DOCTOR
// ==============================
export const unblockDoctorController = asyncHandler(
  async (req, res) => {
    await unblockDoctorService(req.params.id);

    sendResponse(
      res,
      200,
      true,
      "Doctor unblocked successfully"
    );
  }
);


export const verifyDoctorAccountController =
  asyncHandler(async (req, res) => {
    const {
      email,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    validateDoctorVerificationInput(
      email,
      otp,
      newPassword,
      confirmPassword
    );

    await verifyDoctorAccountService(
      email,
      otp,
      newPassword
    );

    sendResponse(
      res,
      200,
      true,
      "Doctor account verified successfully"
    );
  });


  export const refreshDoctorTokenController =
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.doctorRefreshToken;

    const data = await refreshDoctorTokenService(refreshToken);

    setAuthCookies(
      res,
      data.accessToken,
      data.refreshToken,
      "doctor"
    );

    sendResponse(
      res,
      200,
      true,
      "Token refreshed successfully"
    );
  });

  export const resendDoctorVerificationOtpController =
  asyncHandler(async (
    req,
    res
  ) => {

    const { email } =
      req.body;

    validateDoctorResendOtpInput(
      email
    );

    await resendDoctorVerificationOtpService(
      email
    );

    sendResponse(
      res,
      200,
      true,
      "OTP resent successfully"
    );
  });

  export const forgotDoctorPasswordController =
  asyncHandler(async (
    req,
    res
  ) => {

    const { email } =
      req.body;

    validateDoctorForgotPasswordInput(
      email
    );

    await forgotDoctorPasswordService(
      email
    );

    sendResponse(
      res,
      200,
      true,
      "Forgot password OTP sent"
    );
  });

 export const resetDoctorPasswordController =
  asyncHandler(async (req, res) => {
    const {
      email,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    validateDoctorResetPasswordInput(
      email,
      otp,
      newPassword,
      confirmPassword
    );

    await resetDoctorPasswordService(
      email,
      otp,
      newPassword
    );

    clearAuthCookies(res, "doctor");

    sendResponse(
      res,
      200,
      true,
      "Password reset successful"
    );
  });


  export const resendForgotPasswordOtpController =
  asyncHandler(async (
    req,
    res
  ) => {

    const { email } =
      req.body;

    validateDoctorForgotPasswordInput(
      email
    );

    await resendForgotPasswordOtpService(
      email
    );

    sendResponse(
      res,
      200,
      true,
      "Forgot password OTP resent"
    );
  });

  export const getDoctorDetailsController = asyncHandler(async (req, res) => {
  const doctorId = req.params.id;

  const doctor = await getDoctorDetailsService(doctorId);

  sendResponse(
    res,
    200,
    true,
    "Doctor details fetched successfully",
    doctor
  );
});

export const updateDoctorConsultationFeeController = asyncHandler(
  async (req, res) => {
    const { consultationFee } = req.body;

    validateDoctorConsultationFeeInput(consultationFee);

    const result = await updateDoctorConsultationFeeService(
      req.params.id,
      consultationFee
    );

    sendResponse(
      res,
      200,
      true,
      "Consultation fee updated successfully",
      result
    );
  }
);

export const updateDoctorProfileImageController = asyncHandler(
  async (req, res) => {
    const updatedDoctor = await updateDoctorProfileImageService(
      req.doctor.doctorId,
      req.file
    );

    sendResponse(
      res,
      200,
      true,
      "Profile image updated successfully",
      updatedDoctor
    );
  }
);