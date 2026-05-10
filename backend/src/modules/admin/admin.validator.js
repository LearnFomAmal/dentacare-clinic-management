import AppError from "../../shared/errors/AppError.js";


// ==============================
// EMAIL VALIDATOR
// ==============================
const validateEmail = (email) => {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new AppError(
      "Invalid email format",
      400
    );
  }
};


// ==============================
// PASSWORD VALIDATOR
// ==============================
const validatePassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;

  if (!passwordRegex.test(password)) {
    throw new AppError(
      "Password must contain uppercase, lowercase, number and special character",
      400
    );
  }
};


// ==============================
// ADMIN LOGIN VALIDATION
// ==============================
export const validateAdminLoginInput = (
  email,
  password
) => {
  if (!email || !password) {
    throw new AppError(
      "Email and password are required",
      400
    );
  }

  validateEmail(email);
};


// ==============================
// FORGOT PASSWORD VALIDATION
// ==============================
export const validateForgotPasswordInput =
  (email) => {
    if (!email) {
      throw new AppError(
        "Email is required",
        400
      );
    }

    validateEmail(email);
  };


// ==============================
// VERIFY OTP VALIDATION
// ==============================
export const validateVerifyOtpInput = (
  email,
  otp
) => {
  if (!email || !otp) {
    throw new AppError(
      "Email and OTP are required",
      400
    );
  }

  if(!/^\d{6}$/.test(otp)) {
    throw new AppError(
      "OTP must be 6 digits",
      400
    );
  }

  validateEmail(email);
};


// ==============================
// RESET PASSWORD VALIDATION
// ==============================
export const validateResetPasswordInput = (
  email,
  password
) => {
  if (!email || !password) {
    throw new AppError(
      "Email and password are required",
      400
    );
  }

  validateEmail(email);

  validatePassword(password);
};