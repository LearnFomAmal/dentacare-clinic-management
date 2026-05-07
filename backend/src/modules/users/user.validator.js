import AppError from "../../shared/errors/AppError.js";

export const validateUpdateProfileInput = (data) => {
  if (!data) return;

  if (data.personalInfo?.phoneNumber) {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(data.personalInfo.phoneNumber)) {
      throw new AppError("Invalid phone number", 400);
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

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters", 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError("New password must be different from current password", 400);
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