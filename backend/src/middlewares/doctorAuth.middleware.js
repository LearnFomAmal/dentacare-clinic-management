import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import AppError from "../shared/errors/AppError.js";
import { findDoctorById } from "../modules/doctors/doctor.repository.js";

export const protectDoctor = async (req, res, next) => {
  try {
    const token = req.cookies?.doctorAccessToken;

    if (!token) {
      return next(new AppError("Unauthorized access", 401));
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

    if (decoded.role !== "doctor") {
      return next(new AppError("Doctor access only", 403));
    }

    if (!decoded.doctorId) {
      return next(new AppError("Invalid doctor token", 401));
    }

    const doctor = await findDoctorById(decoded.doctorId);

    if (!doctor) {
      return next(new AppError("Doctor not found", 404));
    }

    if (doctor.accountStatus?.isDeleted) {
      return next(new AppError("Doctor account deleted", 403));
    }

    if (doctor.accountStatus?.isBlocked) {
      return next(new AppError("Doctor account blocked", 403));
    }

    if (!doctor.accountStatus?.isEmailVerified) {
      return next(new AppError("Please verify your email first", 403));
    }

    req.doctor = {
      doctorId: doctor._id.toString(),
      role: "doctor",

      isEmailVerified: Boolean(doctor.accountStatus?.isEmailVerified),
      isVerified: Boolean(doctor.accountStatus?.isVerified),
      verificationStatus: doctor.verification?.status || "not_submitted",
    };

    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

export const requireVerifiedDoctor = (req, res, next) => {
  if (!req.doctor?.isVerified) {
    return next(
      new AppError(
        "Your documents must be approved by admin before using this feature",
        403
      )
    );
  }

  next();
};