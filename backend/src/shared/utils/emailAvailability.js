import User from "../../models/User.js";
import Doctor from "../../models/Doctor.js";
import Admin from "../../models/Admin.js";
import Otp from "../../models/Otp.js";
import AppError from "../errors/AppError.js";

export const normalizeEmail = (email) => {
  return String(email || "").trim().toLowerCase();
};

export const ensureEmailAvailableAcrossRoles = async (
  email,
  options = {}
) => {
  const {
    currentPurpose = "",
    checkPendingRegistration = true,
  } = options;

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const [existingPatient, existingDoctor, existingAdmin] =
    await Promise.all([
      User.findOne({ email: normalizedEmail }).select("_id email"),
      Doctor.findOne({ email: normalizedEmail }).select("_id email"),
      Admin.findOne({ email: normalizedEmail }).select("_id email"),
    ]);

  if (existingPatient || existingDoctor || existingAdmin) {
    throw new AppError(
      "Email is already registered with another account",
      400
    );
  }

  if (checkPendingRegistration) {
    const registrationPurposes = ["register", "doctor_register"];

    const pendingPurposeQuery = currentPurpose
      ? {
          $in: registrationPurposes.filter(
            (purpose) => purpose !== currentPurpose
          ),
        }
      : {
          $in: registrationPurposes,
        };

    const pendingRegistration = await Otp.findOne({
      email: normalizedEmail,
      purpose: pendingPurposeQuery,
      isUsed: false,
      expiresAt: {
        $gt: new Date(),
      },
    }).select("_id email purpose");

    if (pendingRegistration) {
      throw new AppError(
        "A registration request is already pending with this email",
        400
      );
    }
  }

  return normalizedEmail;
};