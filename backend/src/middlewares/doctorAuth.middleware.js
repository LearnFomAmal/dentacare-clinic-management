import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import AppError from "../shared/errors/AppError.js";
import { findDoctorById } from "../modules/doctors/doctor.repository.js";

export const protectDoctor = async (
  req,
  res,
  next
) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(
        new AppError("Unauthorized access", 401)
      );
    }

    const decoded = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET
    );

    if (decoded.role !== "doctor") {
      return next(
        new AppError("Doctor access only", 403)
      );
    }

    const doctor = await findDoctorById(
      decoded.doctorId
    );

    if (!doctor) {
      return next(
        new AppError("Doctor not found", 404)
      );
    }

    if (doctor.accountStatus?.isDeleted) {
      return next(
        new AppError(
          "Doctor account deleted",
          403
        )
      );
    }

    if (doctor.accountStatus?.isBlocked) {
      return next(
        new AppError(
          "Doctor account blocked",
          403
        )
      );
    }

    if (!doctor.accountStatus?.isVerified) {
      return next(
        new AppError(
          "Doctor account not verified",
          403
        )
      );
    }

    req.doctor = {
      doctorId: decoded.doctorId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return next(
      new AppError(
        "Invalid or expired token",
        401
      )
    );
  }
};