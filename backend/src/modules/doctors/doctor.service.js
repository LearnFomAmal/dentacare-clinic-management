import AppError from "../../shared/errors/AppError.js";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

import {
  resendDoctorOtpMail,
  sendDoctorForgotPasswordOtpMail,
  sendDoctorRegisterOtpMail,
  sendDoctorVerificationApprovedMail,
  sendDoctorVerificationMail,
  sendDoctorVerificationRejectedMail,
} from "../../config/mailer.js";

import {
  compareOtp,
  hashOtp,
} from "../../shared/utils/hashOtp.js";

import {
  hashPassword,
  comparePassword,
} from "../../shared/utils/passwordHash.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/utils/generateToken.js";

import {
  uploadBufferToCloudinary,
  uploadFileBufferToCloudinary,
} from "../../shared/utils/cloudinaryUpload.js";

import {
  safeCreateAdminNotification,
  safeCreateNotification,
} from "../notifications/notification.service.js";

import {
  createSession,
  revokeSessionByRefreshToken,
  revokeAllSessionsByUserId,
  countActiveSessionsByUserId,
  revokeOldestSessionByUserId,
  findSessionByRefreshToken,
  updateSessionRefreshToken,
} from "../auth/session.repository.js";

import generateOtp from "../../shared/utils/otpGenerator.js";
import generateTempPassword from "../../shared/utils/generateTempPassword.js";

import {
  createOtpRecord,
  findOtpRecord,
  deleteOldOtps,
} from "../auth/auth.repository.js";

import { findSpecialtyById } from "../specialties/specialty.repository.js";

import {
  createDoctor,
  findDoctorByEmail,
  findDoctorByEmailWithPassword,
  findDoctorById,
  updateDoctorById,
  softDeleteDoctorById,
  blockDoctorById,
  unblockDoctorById,
  getAllDoctors,
  findDoctorDetailsById,
  updateDoctorConsultationFeeById,
  updateDoctorProfileImageById,
  findDoctorsForVerification,
  updateDoctorVerificationDocumentsById,
  approveDoctorVerificationById,
  rejectDoctorVerificationById,
} from "./doctor.repository.js";

import {
  ensureEmailAvailableAcrossRoles,
  normalizeEmail,
} from "../../shared/utils/emailAvailability.js";
const SELF_REGISTER_DEFAULT_CONSULTATION_FEE = 500;
const sanitizeDoctorResponse = (doctor) => {
  return {
    _id: doctor._id,

    firstName: doctor.firstName,
    lastName: doctor.lastName,
    email: doctor.email,

    specialization: doctor.specialization,

    professionalInfo: {
      experience: doctor.professionalInfo?.experience || 0,
      education: doctor.professionalInfo?.education || "",
      consultationFee:
        doctor.professionalInfo?.consultationFee || 0,
      contactNumber:
        doctor.professionalInfo?.contactNumber || "",
      profileImage:
        doctor.professionalInfo?.profileImage || "",
    },

    profileImage:
      doctor.professionalInfo?.profileImage || "",

    settings: {
      theme: doctor.settings?.theme || "light",
    },

    stats: {
      averageRating: doctor.stats?.averageRating || 0,
      totalReviews: doctor.stats?.totalReviews || 0,
      totalPatients: doctor.stats?.totalPatients || 0,
      totalAppointments: doctor.stats?.totalAppointments || 0,
    },

    accountStatus: {
  isEmailVerified: doctor.accountStatus?.isEmailVerified || false,
  isVerified: doctor.accountStatus?.isVerified || false,
  isBlocked: doctor.accountStatus?.isBlocked || false,
  isDeleted: doctor.accountStatus?.isDeleted || false,
  mustChangePassword:
    doctor.accountStatus?.mustChangePassword || false,
},
     verification: doctor.verification || {
  status: "not_submitted",
},

documents: doctor.documents || {},
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
};


// ==============================
// ADMIN CREATE DOCTOR
// ==============================
// ==============================
// ADMIN CREATE DOCTOR
// ==============================
export const createDoctorService = async (data) => {
  const {
    firstName,
    lastName,
    email,
    specializationId,
    experience,
    education,
    consultationFee,
    contactNumber,
  } = data;

  const normalizedEmail = await ensureEmailAvailableAcrossRoles(email);

  const tempPassword = generateTempPassword();

  const specialty = await findSpecialtyById(specializationId);

  if (!specialty) {
    throw new AppError("Specialty not found", 404);
  }

  if (specialty.status !== "active") {
    throw new AppError("Specialty is inactive", 400);
  }

  const hashedPassword = await hashPassword(tempPassword);

  const doctor = await createDoctor({
    firstName: firstName.trim(),
    lastName: lastName.trim(),

    // ✅ FIXED
    email: normalizedEmail,

    password: hashedPassword,

    specialization: {
      specialtyId: specialty._id,
      name: specialty.name,
      displayName: specialty.displayName || specialty.name,
    },

    professionalInfo: {
      experience: Number(experience),
      education: education.trim(),
      consultationFee: Number(consultationFee),
      contactNumber: contactNumber.trim(),
    },

    accountStatus: {
      isEmailVerified: false,
      isVerified: false,
      isBlocked: false,
      isDeleted: false,
      mustChangePassword: true,
    },

    verification: {
      status: "not_submitted",
    },
  });

  await deleteOldOtps(normalizedEmail, "doctor_verify");

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  await createOtpRecord({
    // ✅ FIXED
    email: normalizedEmail,

    otp: hashedOtp,
    purpose: "doctor_verify",

    doctorId: doctor._id,

    expiresAt: new Date(Date.now() + 5 * 60 * 1000),

    resendAvailableAt: new Date(Date.now() + 60 * 1000),
  });

  await sendDoctorVerificationMail(
    normalizedEmail,
    otp,
    tempPassword
  );

  return sanitizeDoctorResponse(doctor);
};

// ==============================
// DOCTOR LOGIN
// ==============================
export const doctorLoginService = async (
  email,
  password,
  userAgent,
  ipAddress
) => {
  const doctor = await findDoctorByEmailWithPassword(email);

  if (!doctor) {
    throw new AppError("Invalid email or password", 400);
  }

  if (doctor.accountStatus.isBlocked) {
    throw new AppError("Doctor account blocked", 403);
  }

  if (doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor account deleted", 403);
  }
  
if (!doctor.accountStatus.isEmailVerified) {
  throw new AppError(
    "Please verify your email first",
    403
  );
}
  

  const isPasswordMatched = await comparePassword(
    password,
    doctor.password
  );

  if (!isPasswordMatched) {
    throw new AppError("Invalid email or password", 400);
  }

  if (
  doctor.accountStatus.mustChangePassword
) {
  throw new AppError(
    "Please verify account and change temporary password",
    403
  );
}
  

  const accessToken = generateAccessToken({
    doctorId: doctor._id,
    role: "doctor",
  });

  const refreshToken = generateRefreshToken({
    doctorId: doctor._id,
    role: "doctor",
  });

  const activeSessions = await countActiveSessionsByUserId(
  doctor._id,
  "doctor"
);

  if (activeSessions >= 5) {
    await revokeOldestSessionByUserId(doctor._id, "doctor");
  }

  await createSession({
    userId: doctor._id,
     userType: "doctor",
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
   

  const doctorData = {
    _id: doctor._id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    email: doctor.email,
    specialization: doctor.specialization,
    profileImage: doctor.professionalInfo.profileImage,
    theme: doctor.settings.theme,
    accountStatus: doctor.accountStatus,
    verification: doctor.verification,
  };

  return {
    accessToken,
    refreshToken,
    doctorData,
  };
};


// ==============================
// GET MY PROFILE
// ==============================
export const getMyDoctorProfileService = async (doctorId) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

 return sanitizeDoctorResponse(doctor);
};


// ==============================
// UPDATE PROFILE
// ==============================
export const updateDoctorProfileService = async (
  doctorId,
  payload
) => {
  const doctor = await findDoctorById(doctorId);
const allowedPayload = {};

if (payload.firstName) {
  allowedPayload.firstName = payload.firstName;
}

if (payload.lastName) {
  allowedPayload.lastName = payload.lastName;
}

if (payload.professionalInfo?.education) {
  allowedPayload["professionalInfo.education"] =
    payload.professionalInfo.education;
}

if (payload.professionalInfo?.contactNumber) {
  allowedPayload["professionalInfo.contactNumber"] =
    payload.professionalInfo.contactNumber;
}

if (payload.professionalInfo?.profileImage) {
  allowedPayload["professionalInfo.profileImage"] =
    payload.professionalInfo.profileImage;
}
  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  const updatedDoctor = await updateDoctorById(
    doctorId,
    allowedPayload
  );

 return sanitizeDoctorResponse(updatedDoctor);

};


// ==============================
// CHANGE PASSWORD
// ==============================
export const changeDoctorPasswordService = async (
  doctorId,
  currentPassword,
  newPassword
) => {
  const doctor = await findDoctorById(doctorId).select("+password");

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  const isMatch = await comparePassword(
    currentPassword,
    doctor.password
  );

  if (!isMatch) {
    throw new AppError("Current password incorrect", 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await updateDoctorById(doctorId, {
    password: hashedPassword,
  });

  await revokeAllSessionsByUserId(doctorId, "doctor");
};


// ==============================
// LOGOUT
// ==============================
export const doctorLogoutService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("No active session found", 400);
  }

  await revokeSessionByRefreshToken(refreshToken);
};


// ==============================
// DELETE ACCOUNT
// ==============================
export const deleteDoctorAccountService = async (doctorId) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  await softDeleteDoctorById(doctorId);

  await revokeAllSessionsByUserId(doctorId, "doctor");
};


// ==============================
// ACTIVE SESSIONS
// ==============================
export const getDoctorSessionInfoService = async (doctorId) => {
  const activeSessions = await countActiveSessionsByUserId(
    doctorId,
    "doctor"
  );

  return {
    activeSessions,
  };
};


// ==============================
// UPDATE THEME
// ==============================
export const updateDoctorThemeService = async (
  doctorId,
  theme
) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  const updatedDoctor = await updateDoctorById(
    doctorId,
    {
      "settings.theme": theme,
    }
  );

  return updatedDoctor.settings;
};


// ==============================
// ADMIN GET ALL DOCTORS
// ==============================
export const getAllDoctorsService = async (filters, options) => {
  return getAllDoctors(filters, options);
};

// ==============================
// ADMIN BLOCK DOCTOR
// ==============================
export const blockDoctorService = async (doctorId) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  await blockDoctorById(doctorId);

  await revokeAllSessionsByUserId(doctorId, "doctor");
};


// ==============================
// ADMIN UNBLOCK DOCTOR
// ==============================
export const unblockDoctorService = async (doctorId) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  await unblockDoctorById(doctorId);
};

export const verifyDoctorAccountService = async (
  email,
  otp,
  newPassword
) => {
  const otpRecord = await findOtpRecord(email, "doctor_verify");

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
    throw new AppError("Maximum OTP attempts exceeded", 400);
  }

  const doctor = await findDoctorById(otpRecord.doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  if (doctor.accountStatus.isEmailVerified) {
  throw new AppError("Doctor email already verified", 400);
}

  const isOtpValid = await compareOtp(otp, otpRecord.otp);

  if (!isOtpValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    throw new AppError("Invalid OTP", 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await updateDoctorById(doctor._id, {
  password: hashedPassword,
  "accountStatus.isEmailVerified": true,
  "accountStatus.mustChangePassword": false,
  "verification.status": "not_submitted",
});

  otpRecord.isUsed = true;
  await otpRecord.save();

  await deleteOldOtps(email, "doctor_verify");
};

export const refreshDoctorTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  if (decoded.role !== "doctor") {
    throw new AppError("Invalid token role", 403);
  }

  const session = await findSessionByRefreshToken(refreshToken);

  if (!session) {
    throw new AppError("Session expired", 401);
  }

  if (session.userType !== "doctor") {
    throw new AppError("Invalid session type", 401);
  }

  if (new Date() > session.expiresAt) {
    throw new AppError("Session expired", 401);
  }

  const doctor = await findDoctorById(decoded.doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (doctor.accountStatus.isBlocked) {
    throw new AppError("Doctor blocked", 403);
  }

  if (doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor deleted", 403);
  }

   if (!doctor.accountStatus.isEmailVerified) {
  throw new AppError("Please verify your email first", 403);
  }

  if (session.userId.toString() !== doctor._id.toString()) {
    throw new AppError("Session mismatch", 401);
  }

  const newAccessToken = generateAccessToken({
    doctorId: doctor._id,
    role: "doctor",
  });

  const newRefreshToken = generateRefreshToken({
    doctorId: doctor._id,
    role: "doctor",
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

  export const resendDoctorVerificationOtpService =
  async (email) => {

    const doctor =
      await findDoctorByEmail(email);

    if (!doctor) {
      throw new AppError(
        "Doctor not found",
        404
      );
    }

 if (doctor.accountStatus.isEmailVerified) {
  throw new AppError(
    "Doctor email already verified",
    400
  );
}

    const otpRecord =
      await findOtpRecord(
        email,
        "doctor_verify"
      );

    if (!otpRecord) {
      throw new AppError(
        "OTP record not found",
        404
      );
    }

    // COOLDOWN CHECK
    if (
      new Date() <
      otpRecord.resendAvailableAt
    ) {
      const secondsLeft =
        Math.ceil(
          (
            otpRecord
              .resendAvailableAt -
            new Date()
          ) / 1000
        );

      throw new AppError(
        `Please wait ${secondsLeft}s before requesting another OTP`,
        400
      );
    }

    // MAX RESEND LIMIT
    if (
      otpRecord.resendCount >= 5
    ) {
      throw new AppError(
        "Maximum OTP resend limit exceeded",
        400
      );
    }

    const newOtp =
      generateOtp();

    const hashedOtp =
      await hashOtp(newOtp);

    otpRecord.otp =
      hashedOtp;

    otpRecord.attempts = 0;

    otpRecord.resendCount += 1;

    otpRecord.expiresAt =
      new Date(
        Date.now() +
        5 * 60 * 1000
      );

    otpRecord.resendAvailableAt =
      new Date(
        Date.now() +
        60 * 1000
      );

    await otpRecord.save();

    await resendDoctorOtpMail(
      email,
      newOtp
    );

    return;
  };

export const forgotDoctorPasswordService = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  const doctor = await findDoctorByEmail(normalizedEmail);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (doctor.accountStatus.isBlocked) {
    throw new AppError("Doctor account blocked", 403);
  }

  if (doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor account deleted", 403);
  }

  await deleteOldOtps(
    normalizedEmail,
    "doctor_forgot_password"
  );

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  await createOtpRecord({
    email: normalizedEmail,
    otp: hashedOtp,
    purpose: "doctor_forgot_password",
    doctorId: doctor._id,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    resendAvailableAt: new Date(Date.now() + 60 * 1000),
  });

  await sendDoctorForgotPasswordOtpMail(
    normalizedEmail,
    otp
  );
};
 export const resetDoctorPasswordService = async (
  email,
  otp,
  newPassword
) => {
  const normalizedEmail = normalizeEmail(email);

const otpRecord = await findOtpRecord(
  normalizedEmail,
  "doctor_forgot_password"
);

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
    throw new AppError("Maximum OTP attempts exceeded", 400);
  }

  const isOtpValid = await compareOtp(otp, otpRecord.otp);

  if (!isOtpValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    throw new AppError("Invalid OTP", 400);
  }

  const doctor = await findDoctorByEmail(normalizedEmail).select("+password");

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }
  const isSamePassword = await comparePassword(
  newPassword,
  doctor.password
);

if (isSamePassword) {
  throw new AppError(
    "New password cannot be same as old password",
    400
  );
}

  const hashedPassword = await hashPassword(newPassword);

  await updateDoctorById(doctor._id, {
    password: hashedPassword,
  });

  await revokeAllSessionsByUserId(doctor._id, "doctor");

  otpRecord.isUsed = true;
  await otpRecord.save();

  await deleteOldOtps(normalizedEmail, "doctor_forgot_password");
};

 export const resendForgotPasswordOtpService = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  const doctor = await findDoctorByEmail(normalizedEmail);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (doctor.accountStatus?.isBlocked) {
    throw new AppError("Doctor account blocked", 403);
  }

  if (doctor.accountStatus?.isDeleted) {
    throw new AppError("Doctor account deleted", 403);
  }

  const otpRecord = await findOtpRecord(
    normalizedEmail,
    "doctor_forgot_password"
  );

  if (!otpRecord) {
    throw new AppError("OTP record not found", 404);
  }

  if (otpRecord.isUsed) {
    throw new AppError("OTP already used. Please request again.", 400);
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
  otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  otpRecord.resendAvailableAt = new Date(Date.now() + 60 * 1000);

  await otpRecord.save();

  await sendDoctorForgotPasswordOtpMail(normalizedEmail, newOtp);
};

  export const getDoctorDetailsService = async (doctorId) => {
  const doctor = await findDoctorDetailsById(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return {
    _id: doctor._id,

    name: `${doctor.firstName} ${doctor.lastName}`,

    email: doctor.email,

    phone: doctor.professionalInfo?.contactNumber || null,

    specialization: doctor.specialization,

    experience: doctor.professionalInfo?.experience,

    consultationFee: doctor.professionalInfo?.consultationFee,

    profileImage: doctor.professionalInfo?.profileImage || "",

    joinedAt: doctor.createdAt,

    accountStatus: doctor.accountStatus,

    education: doctor.professionalInfo?.education,

    settings: doctor.settings,
  verification: doctor.verification || {
  status: "not_submitted",
},

documents: doctor.documents || {},
    stats: {
      averageRating: doctor.stats?.averageRating || 0,
      totalReviews: doctor.stats?.totalReviews || 0,
      totalPatients: doctor.stats?.totalPatients || 0,
      totalAppointments: doctor.stats?.totalAppointments || 0,
    },
  };
};

export const updateDoctorConsultationFeeService = async (
  doctorId,
  consultationFee
) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  const previousFee = doctor.professionalInfo?.consultationFee;

  const updatedDoctor = await updateDoctorConsultationFeeById(
    doctorId,
    Number(consultationFee)
  );

  return {
    _id: updatedDoctor._id,
    name: `${updatedDoctor.firstName} ${updatedDoctor.lastName}`,
    experience: updatedDoctor.professionalInfo?.experience,
    previousConsultationFee: previousFee,
    currentConsultationFee:
      updatedDoctor.professionalInfo?.consultationFee,
  };
};

export const updateDoctorProfileImageService = async (
  doctorId,
  file
) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  if (!file) {
    throw new AppError("Profile image is required", 400);
  }

  const uploadResult = await uploadBufferToCloudinary({
    buffer: file.buffer,
    folder: "dentacare/doctors",
    publicId: `doctor_${doctor._id}`,
  });

  const updatedDoctor = await updateDoctorProfileImageById(
    doctor._id,
    uploadResult.secure_url
  );

  return sanitizeDoctorResponse(updatedDoctor);
};

export const registerDoctorService = async (body) => {
const {
  firstName,
  lastName,
  email,
  password,
  specializationId,
  experience,
  education,
  contactNumber,
} = body;

  const normalizedEmail = await ensureEmailAvailableAcrossRoles(email, {
  currentPurpose: "doctor_register",
});
  const specialty = await findSpecialtyById(specializationId);

  if (!specialty) {
    throw new AppError("Specialty not found", 404);
  }

  if (specialty.status !== "active") {
    throw new AppError("Specialty is inactive", 400);
  }

  const hashedPassword = await hashPassword(password);

  await deleteOldOtps(normalizedEmail, "doctor_register");

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  await createOtpRecord({
    email: normalizedEmail,
    otp: hashedOtp,
    purpose: "doctor_register",

    tempDoctorData: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email:  normalizedEmail,
      password: hashedPassword,
      specializationId: specialty._id,
      experience: Number(experience),
      education: education.trim(),
      consultationFee: SELF_REGISTER_DEFAULT_CONSULTATION_FEE,
      contactNumber: contactNumber.trim(),
    },

    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    resendAvailableAt: new Date(Date.now() + 60 * 1000),
  });

  await sendDoctorRegisterOtpMail(normalizedEmail, otp);

  return {
  email: normalizedEmail,
  otpSent: true,
};
};

export const verifyDoctorRegisterOtpService = async ({
  email,
  otp,
}) => {
  const normalizedEmail = normalizeEmail(email);

const otpRecord = await findOtpRecord(
  normalizedEmail,
  "doctor_register"
);

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
    throw new AppError("Maximum OTP attempts exceeded", 400);
  }

  const isOtpValid = await compareOtp(otp, otpRecord.otp);

  if (!isOtpValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    throw new AppError("Invalid OTP", 400);
  }

  const tempDoctorData = otpRecord.tempDoctorData;

  if (!tempDoctorData?.email) {
    throw new AppError("Doctor registration data missing", 400);
  }

  await ensureEmailAvailableAcrossRoles(normalizedEmail, {
  checkPendingRegistration: false,
});

  const specialty = await findSpecialtyById(
    tempDoctorData.specializationId
  );

  if (!specialty || specialty.status !== "active") {
    throw new AppError("Specialty not found or inactive", 404);
  }

  const doctor = await createDoctor({
    firstName: tempDoctorData.firstName,
    lastName: tempDoctorData.lastName,
    email: tempDoctorData.email,
    password: tempDoctorData.password,

    specialization: {
      specialtyId: specialty._id,
      name: specialty.name,
      displayName: specialty.displayName || specialty.name,
    },

    professionalInfo: {
      experience: Number(tempDoctorData.experience),
      education: tempDoctorData.education,
      consultationFee:
  Number(tempDoctorData.consultationFee) ||
  SELF_REGISTER_DEFAULT_CONSULTATION_FEE,
      contactNumber: tempDoctorData.contactNumber,
    },

    accountStatus: {
      isEmailVerified: true,
      isVerified: false,
      isBlocked: false,
      isDeleted: false,
      mustChangePassword: false,
    },

    verification: {
      status: "not_submitted",
    },
  });

  otpRecord.isUsed = true;
  await otpRecord.save();

  await deleteOldOtps(normalizedEmail, "doctor_register");

  await safeCreateAdminNotification({
    actorRole: "doctor",
    actorId: doctor._id,
    actorName: `${doctor.firstName} ${doctor.lastName}`,
    type: "doctor_registered",
    title: "New Doctor Registered",
    message: "A new doctor registered and needs document verification.",
    referenceType: "doctor",
    referenceId: doctor._id,
  });

  return sanitizeDoctorResponse(doctor);
};

export const resendDoctorRegisterOtpService = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  await ensureEmailAvailableAcrossRoles(normalizedEmail, {
    currentPurpose: "doctor_register",
  });

  const otpRecord = await findOtpRecord(
    normalizedEmail,
    "doctor_register"
  );

  if (!otpRecord) {
    throw new AppError("OTP record not found", 404);
  }

  if (otpRecord.isUsed) {
    throw new AppError("OTP already used. Please register again.", 400);
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
    throw new AppError("Maximum OTP resend limit exceeded", 400);
  }

  const newOtp = generateOtp();
  const hashedOtp = await hashOtp(newOtp);

  otpRecord.otp = hashedOtp;
  otpRecord.attempts = 0;
  otpRecord.resendCount += 1;
  otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  otpRecord.resendAvailableAt = new Date(Date.now() + 60 * 1000);

  await otpRecord.save();

  await sendDoctorRegisterOtpMail(normalizedEmail, newOtp);
};

export const getMyDoctorVerificationService = async (doctorId) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  return {
    accountStatus: doctor.accountStatus,
    verification: doctor.verification,
    documents: doctor.documents,
  };
};

const getUploadedFile = (files, fieldName) => {
  return Array.isArray(files?.[fieldName])
    ? files[fieldName][0]
    : null;
};

export const uploadDoctorVerificationDocumentsService = async ({
  doctorId,
  files,
}) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  if (!doctor.accountStatus.isEmailVerified) {
    throw new AppError("Please verify your email first", 403);
  }

if (doctor.accountStatus.isBlocked) {
  throw new AppError("Doctor account is blocked", 403);
}

const currentVerificationStatus =
  doctor.verification?.status || "not_submitted";

if (currentVerificationStatus === "pending") {
  throw new AppError(
    "Your documents are already submitted and waiting for admin approval",
    400
  );
}

if (currentVerificationStatus === "approved") {
  throw new AppError(
    "Your documents are already approved. Please contact admin for changes.",
    400
  );
}

const educationFile = getUploadedFile(files, "educationCertificate");
  const qualificationFile = getUploadedFile(files, "qualificationCertificate");
  const registrationFile = getUploadedFile(files, "registrationCertificate");

  if (!educationFile || !qualificationFile || !registrationFile) {
    throw new AppError(
      "Education, qualification and registration certificates are required",
      400
    );
  }

  const [educationUpload, qualificationUpload, registrationUpload] =
    await Promise.all([
      uploadFileBufferToCloudinary({
        buffer: educationFile.buffer,
        folder: "dentacare/doctors/certificates",
        publicId: `doctor_${doctor._id}_education`,
      }),
      uploadFileBufferToCloudinary({
        buffer: qualificationFile.buffer,
        folder: "dentacare/doctors/certificates",
        publicId: `doctor_${doctor._id}_qualification`,
      }),
      uploadFileBufferToCloudinary({
        buffer: registrationFile.buffer,
        folder: "dentacare/doctors/certificates",
        publicId: `doctor_${doctor._id}_registration`,
      }),
    ]);

  const updatedDoctor = await updateDoctorVerificationDocumentsById({
  doctorId,
  allowedStatuses: ["not_submitted", "rejected"],
  payload: {
      "accountStatus.isVerified": false,

      "verification.status": "pending",
      "verification.submittedAt": new Date(),
      "verification.reviewedAt": null,
      "verification.reviewedBy": null,
      "verification.rejectionReason": "",

      "documents.educationCertificate": {
        url: educationUpload.secure_url,
        publicId: educationUpload.public_id,
        uploadedAt: new Date(),
      },

      "documents.qualificationCertificate": {
        url: qualificationUpload.secure_url,
        publicId: qualificationUpload.public_id,
        uploadedAt: new Date(),
      },

      "documents.registrationCertificate": {
        url: registrationUpload.secure_url,
        publicId: registrationUpload.public_id,
        uploadedAt: new Date(),
      },
    },
  });
    if (!updatedDoctor) {
  throw new AppError(
    "Documents cannot be uploaded now. Current verification status does not allow upload.",
    400
  );
}
  await safeCreateAdminNotification({
    actorRole: "doctor",
    actorId: doctor._id,
    actorName: `${doctor.firstName} ${doctor.lastName}`,
    type: "doctor_documents_submitted",
    title: "Doctor Documents Submitted",
    message: "A doctor submitted certificates for verification.",
    referenceType: "doctor",
    referenceId: doctor._id,
  });

  return sanitizeDoctorResponse(updatedDoctor);
};

export const getDoctorVerificationRequestsService = async ({
  query,
}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 50);
  const status = query.status || "";

  if (
    status &&
    !["not_submitted", "pending", "approved", "rejected"].includes(status)
  ) {
    throw new AppError("Invalid verification status", 400);
  }

  return findDoctorsForVerification({
    status,
    page,
    limit,
  });
};

export const approveDoctorVerificationService = async ({
  doctorId,
  adminId,
}) => {
  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  if (!doctor.accountStatus.isEmailVerified) {
    throw new AppError("Doctor email is not verified yet", 400);
  }

  if (doctor.verification?.status !== "pending") {
    throw new AppError(
      "Only pending verification requests can be approved",
      400
    );
  }

  const hasAllDocuments =
    doctor.documents?.educationCertificate?.url &&
    doctor.documents?.qualificationCertificate?.url &&
    doctor.documents?.registrationCertificate?.url;

  if (!hasAllDocuments) {
    throw new AppError("Doctor has not uploaded all required documents", 400);
  }

  const updatedDoctor = await approveDoctorVerificationById({
    doctorId,
    adminId,
  });

  if (!updatedDoctor) {
  throw new AppError(
    "This verification request is no longer pending or doctor is blocked",
    400
  );
}

  await safeCreateNotification({
    recipientRole: "doctor",
    recipientId: doctor._id,
    actorRole: "admin",
    actorId: adminId,
    actorName: "Admin",
    type: "doctor_verification_approved",
    title: "Verification Approved",
    message: "Your doctor documents were approved. You can now receive appointments.",
    referenceType: "doctor",
    referenceId: doctor._id,
  });

  await sendDoctorVerificationApprovedMail(doctor.email);

  return sanitizeDoctorResponse(updatedDoctor);
};

export const rejectDoctorVerificationService = async ({
  doctorId,
  adminId,
  body,
}) => {
  const rejectionReason = body.rejectionReason.trim();
  const blockDoctor = Boolean(body.blockDoctor || false);

  const doctor = await findDoctorById(doctorId);

  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  if (doctor.verification?.status !== "pending") {
  throw new AppError(
    "Only pending verification requests can be rejected",
    400
  );
}

  const updatedDoctor = await rejectDoctorVerificationById({
    doctorId,
    adminId,
    rejectionReason,
    blockDoctor,
  });
  if (!updatedDoctor) {
  throw new AppError(
    "This verification request is no longer pending",
    400
  );
}
  if (blockDoctor) {
    await revokeAllSessionsByUserId(doctor._id, "doctor");
  }

  await safeCreateNotification({
    recipientRole: "doctor",
    recipientId: doctor._id,
    actorRole: "admin",
    actorId: adminId,
    actorName: "Admin",
    type: "doctor_verification_rejected",
    title: "Verification Rejected",
    message: rejectionReason,
    referenceType: "doctor",
    referenceId: doctor._id,
  });

  await sendDoctorVerificationRejectedMail(
    doctor.email,
    rejectionReason
  );

  return sanitizeDoctorResponse(updatedDoctor);
};
