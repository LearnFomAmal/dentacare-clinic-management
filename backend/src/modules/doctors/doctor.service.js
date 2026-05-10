import AppError from "../../shared/errors/AppError.js";
import jwt from "jsonwebtoken";
import { resendDoctorOtpMail }
  from "../../config/mailer.js";

import { compareOtp }
  from "../../shared/utils/hashOtp.js";

import { env } from "../../config/env.js";
 import { hashOtp } from "../../shared/utils/hashOtp.js";
import {
  sendDoctorForgotPasswordOtpMail,
} from "../../config/mailer.js";


import {
  findSessionByRefreshToken,
  updateSessionRefreshToken,
} from "../auth/session.repository.js";
import {
  hashPassword,
  comparePassword,
} from "../../shared/utils/passwordHash.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/utils/generateToken.js";

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
  verifyDoctorById,
  updateDoctorConsultationFeeById,
} from "./doctor.repository.js";

import {
  createSession,
  revokeSessionByRefreshToken,
  revokeAllSessionsByUserId,
  countActiveSessionsByUserId,
  revokeOldestSessionByUserId,
} from "../auth/session.repository.js";

import generateOtp from "../../shared/utils/otpGenerator.js";

import generateTempPassword from "../../shared/utils/generateTempPassword.js";

import { sendDoctorVerificationMail } from "../../config/mailer.js";

import {
  createOtpRecord,
  findOtpRecord,
  deleteOldOtps,
} from "../auth/auth.repository.js";


import { findSpecialtyById } from "../specialties/specialty.repository.js";
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

  const existingDoctor = await findDoctorByEmail(email);

  if (existingDoctor) {
    throw new AppError("Doctor already exists", 400);
  }

  const tempPassword = generateTempPassword();
const specialty = await findSpecialtyById(
  specializationId
);

if (!specialty) {
  throw new AppError(
    "Specialty not found",
    404
  );
}

if (specialty.status !== "active") {
  throw new AppError(
    "Specialty is inactive",
    400
  );
}
  const hashedPassword = await hashPassword(tempPassword);

  const doctor = await createDoctor({
    firstName,
    lastName,
    email,
    password: hashedPassword,

   specialization: {
  specialtyId: specialty._id,
  name: specialty.name,
},

    professionalInfo: {
      experience,
      education,
      consultationFee,
      contactNumber,
    },
  });

  await deleteOldOtps(email, "doctor_verify");

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);
  await createOtpRecord({
    email,
    otp: hashedOtp,
    purpose: "doctor_verify",

    doctorId: doctor._id,

    expiresAt: new Date(Date.now() + 5 * 60 * 1000),

    resendAvailableAt: new Date(
      Date.now() + 60 * 1000
    ),
  });

  await sendDoctorVerificationMail(
    email,
    otp,
    tempPassword
  );

  return doctor;
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
  
  if (!doctor.accountStatus.isVerified) {
  throw new AppError(
    "Please verify your account first",
    403
  );
  }

  const isPasswordMatched = await comparePassword(
    password,
    doctor.password
  );
  if (
  doctor.accountStatus.mustChangePassword
) {
  throw new AppError(
    "Please verify account and change temporary password",
    403
  );
}
  if (!isPasswordMatched) {
    throw new AppError("Invalid email or password", 400);
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

  return doctor;
};


// ==============================
// UPDATE PROFILE
// ==============================
export const updateDoctorProfileService = async (
  doctorId,
  payload
) => {
  const doctor = await findDoctorById(doctorId);
 const allowedPayload = {
    firstName: payload.firstName,
    lastName: payload.lastName,
};

if (payload.professionalInfo) {

  allowedPayload.professionalInfo = {};

  if (payload.professionalInfo.education) {
    allowedPayload.professionalInfo.education =
      payload.professionalInfo.education;
  }

  if (
    payload.professionalInfo.contactNumber
  ) {
    allowedPayload.professionalInfo.contactNumber =
      payload.professionalInfo.contactNumber;
  }

  if (
    payload.professionalInfo.profileImage
  ) {
    allowedPayload.professionalInfo.profileImage =
      payload.professionalInfo.profileImage;
  }
}
  if (!doctor || doctor.accountStatus.isDeleted) {
    throw new AppError("Doctor not found", 404);
  }

  const updatedDoctor = await updateDoctorById(
    doctorId,
    allowedPayload,
  );

  return updatedDoctor;
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

  const otpRecord = await findOtpRecord(
    email,
    "doctor_verify"
  );

  if (!otpRecord) {
    throw new AppError("OTP not found", 404);
  }

  const doctor = await findDoctorById(
    otpRecord.doctorId
  );

  if (!doctor) {
    throw new AppError(
      "Doctor not found",
      404
    );
  }

  if (doctor.accountStatus.isVerified) {
    throw new AppError(
      "Doctor already verified",
      400
    );
  }
  if (!otpRecord) {
    throw new AppError("OTP not found", 404);
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new AppError("OTP expired", 400);
  }

  if (otpRecord.attempts >= 5) {
    throw new AppError(
      "Maximum OTP attempts exceeded",
      400
    );
  }
  const isOtpValid =
  await compareOtp(
    otp,
    otpRecord.otp
  );


  if (!isOtpValid) {
    otpRecord.attempts += 1;

    await otpRecord.save();

    throw new AppError("Invalid OTP", 400);
  }

  const hashedPassword = await hashPassword(
    newPassword
  );

  await updateDoctorById(
    otpRecord.doctorId,
    {
      password: hashedPassword,

      "accountStatus.isVerified": true,

      "accountStatus.mustChangePassword": false,
    }
  );
  otpRecord.isUsed = true;
 await otpRecord.save();
 if (otpRecord.isUsed) {
  throw new AppError(
    "OTP already used",
    400
  );
}
  await deleteOldOtps(email, "doctor_verify");
};


export const refreshDoctorTokenService =
  async (refreshToken) => {
    if (!refreshToken) {
      throw new AppError(
        "Refresh token missing",
        401
      );
    }

    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_SECRET
      );
    } catch {
      throw new AppError(
        "Invalid refresh token",
        401
      );
    }

    if (decoded.role !== "doctor") {
      throw new AppError(
        "Invalid token role",
        403
      );
    }

    const session =
      await findSessionByRefreshToken(
        refreshToken
      );

    if (!session) {
      throw new AppError(
        "Session expired",
        401
      );
    }
   if (new Date() > session.expiresAt) {
  throw new AppError(
    "Session expired",
    401
  );
}


    const doctor =
      await findDoctorById(
        decoded.doctorId
      );

    if (!doctor) {
      throw new AppError(
        "Doctor not found",
        404
      );
    }

    if (
      doctor.accountStatus.isBlocked
    ) {
      throw new AppError(
        "Doctor blocked",
        403
      );
    }

    if (
      doctor.accountStatus.isDeleted
    ) {
      throw new AppError(
        "Doctor deleted",
        403
      );
    }
 if (
  session.userId.toString() !==
  doctor._id.toString()
) {
  throw new AppError(
    "Session mismatch",
    401
  );
}
    const newAccessToken =
      generateAccessToken({
        doctorId: doctor._id,
        role: "doctor",
      });

    const newRefreshToken =
      generateRefreshToken({
        doctorId: doctor._id,
        role: "doctor",
      });

    await updateSessionRefreshToken(
      refreshToken,
      newRefreshToken
    );

    return {
      accessToken:
        newAccessToken,

      refreshToken:
        newRefreshToken,
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

    if (
      doctor.accountStatus
        .isVerified
    ) {
      throw new AppError(
        "Doctor already verified",
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

  export const forgotDoctorPasswordService =
  async (email) => {

    const doctor =
      await findDoctorByEmail(
        email
      );

    if (!doctor) {
      throw new AppError(
        "Doctor not found",
        404
      );
    }

    if (
      doctor.accountStatus
        .isBlocked
    ) {
      throw new AppError(
        "Doctor account blocked",
        403
      );
    }

    await deleteOldOtps(
      email,
      "doctor_forgot_password"
    );

    const otp =
      generateOtp();

    const hashedOtp =
      await hashOtp(otp);

    await createOtpRecord({
      email,

      otp: hashedOtp,

      purpose:
        "doctor_forgot_password",

      doctorId:
        doctor._id,

      expiresAt:
        new Date(
          Date.now() +
          5 * 60 * 1000
        ),

      resendAvailableAt:
        new Date(
          Date.now() +
          60 * 1000
        ),
    });

    await sendDoctorForgotPasswordOtpMail(
      email,
      otp
    );

    return;
  };

  export const resetDoctorPasswordService =
  async (
    email,
    otp,
    newPassword
  ) => {

    const otpRecord =
      await findOtpRecord(
        email,
        "doctor_forgot_password"
      );

    if (!otpRecord) {
      throw new AppError(
        "OTP not found",
        404
      );
    }

    if (
      new Date() >
      otpRecord.expiresAt
    ) {
      throw new AppError(
        "OTP expired",
        400
      );
    }

    if (
      otpRecord.attempts >= 5
    ) {
      throw new AppError(
        "Maximum OTP attempts exceeded",
        400
      );
    }

    const isOtpValid =
      await compareOtp(
        otp,
        otpRecord.otp
      );

    if (!isOtpValid) {

      otpRecord.attempts += 1;

      await otpRecord.save();

      throw new AppError(
        "Invalid OTP",
        400
      );
    }

    const doctor =
      await findDoctorByEmail(
        email
      ).select("+password");

    if (!doctor) {
      throw new AppError(
        "Doctor not found",
        404
      );
    }

    const hashedPassword =
      await hashPassword(
        newPassword
      );

    await updateDoctorById(
      doctor._id,
      {
        password:
          hashedPassword,
      }
    );

    // revoke all devices
    await revokeAllSessionsByUserId(
      doctor._id,
      "doctor"
    );
   otpRecord.isUsed = true;
await otpRecord.save();
if (otpRecord.isUsed) {
  throw new AppError(
    "OTP already used",
    400
  );
}
    await deleteOldOtps(
      email,
      "doctor_forgot_password"
    );

    return;
  };

  export const resendForgotPasswordOtpService =
  async (email) => {

    const doctor =
      await findDoctorByEmail(
        email
      );

    if (!doctor) {
      throw new AppError(
        "Doctor not found",
        404
      );
    }

    const otpRecord =
      await findOtpRecord(
        email,
        "doctor_forgot_password"
      );

    if (!otpRecord) {
      throw new AppError(
        "OTP record not found",
        404
      );
    }

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

    if (
      otpRecord.resendCount >= 5
    ) {
      throw new AppError(
        "Maximum resend limit exceeded",
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

    await sendDoctorForgotPasswordOtpMail(
      email,
      newOtp
    );

    return;
  };

  export const getDoctorDetailsService = async (doctorId) => {
  const doctor = await findDoctorDetailsById(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  // Shape response for admin dashboard
  return {
    _id: doctor._id,

    name: `${doctor.firstName} ${doctor.lastName}`,

    email: doctor.email,

    phone:
      doctor.professionalInfo?.contactNumber || null,

    specialization: doctor.specialization,

    experience: doctor.professionalInfo?.experience,

    consultationFee:
      doctor.professionalInfo?.consultationFee,

    profileImage:
      doctor.professionalInfo?.profileImage || "",

    joinedAt: doctor.createdAt,

    accountStatus: doctor.accountStatus,

    education: doctor.professionalInfo?.education,

    settings: doctor.settings,
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
