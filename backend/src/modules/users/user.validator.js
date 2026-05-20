import AppError from "../../shared/errors/AppError.js";

export const validateUpdateProfileInput = (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new AppError("No update data provided", 400);
  }

  if (data.username !== undefined) {
    const usernameRegex = /^[A-Za-z ]{3,30}$/;

    if (
      typeof data.username !== "string" ||
      !usernameRegex.test(data.username.trim())
    ) {
      throw new AppError(
        "Username must contain only letters and spaces, 3-30 characters",
        400
      );
    }
  }

  if (data.personalInfo?.dateOfBirth !== undefined) {
    const dob = new Date(data.personalInfo.dateOfBirth);
    const today = new Date();

    if (Number.isNaN(dob.getTime())) {
      throw new AppError("Invalid date of birth", 400);
    }

    if (dob > today) {
      throw new AppError("Date of birth cannot be in the future", 400);
    }

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    if (age < 6) {
      throw new AppError("Patient must be at least 6 years old", 400);
    }
  }

  if (data.personalInfo?.gender !== undefined) {
    if (!["male", "female", "other"].includes(data.personalInfo.gender)) {
      throw new AppError("Invalid gender selected", 400);
    }
  }

  if (data.personalInfo?.phoneNumber !== undefined) {
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(data.personalInfo.phoneNumber)) {
      throw new AppError("Invalid phone number", 400);
    }
  }

  if (data.personalInfo?.bloodGroup !== undefined) {
    const validBloodGroups = [
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
    ];

    if (!validBloodGroups.includes(data.personalInfo.bloodGroup)) {
      throw new AppError("Invalid blood group", 400);
    }
  }
};


export const validateChangePasswordInput = (
  currentPassword,
  newPassword,
  confirmPassword
) => {

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("All password fields required", 400);
  }
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;

if (!passwordRegex.test(newPassword)) {
  throw new AppError(
    "Password must be 8-20 chars with uppercase, lowercase, number and special character",
    400
  );
}



  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }
};

export const validateThemeInput = (theme) => {
  if (!["light", "dark"].includes(theme)) {
    throw new AppError("Invalid theme", 400);
  }
};