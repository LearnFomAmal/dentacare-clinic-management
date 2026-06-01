import AppError from "../../shared/errors/AppError.js";

export const validateRegisterInput = (data) => {
  const {
    username,
    email,
    password,
    confirmPassword,
    dateOfBirth,
    gender,
    phoneNumber,
    bloodGroup,
    referralCode = "",
  } = data;

  if (
    !username ||
    !email ||
    !password ||
    !confirmPassword ||
    !dateOfBirth ||
    !gender ||
    !phoneNumber ||
    !bloodGroup
  ) {
    throw new AppError("All fields are required", 400);
  }

  const usernameRegex = /^[A-Za-z ]{3,30}$/;

  if (!usernameRegex.test(username)) {
    throw new AppError(
      "Username must contain only letters and spaces, min 3 characters",
      400
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;

  if (!passwordRegex.test(password)) {
    throw new AppError(
      "Password must be 8-20 chars with uppercase, lowercase, number and special character",
      400
    );
  }

  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  const dob = new Date(dateOfBirth);
  const today = new Date();

  if (Number.isNaN(dob.getTime()) || dob > today) {
    throw new AppError("Invalid date of birth", 400);
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

  if (!["male", "female", "other"].includes(gender.toLowerCase())) {
    throw new AppError("Invalid gender selected", 400);
  }

  const phoneRegex = /^[6-9]\d{9}$/;

  if (!phoneRegex.test(phoneNumber)) {
    throw new AppError("Phone number must be valid 10 digit Indian number", 400);
  }

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

  if (!validBloodGroups.includes(bloodGroup.toUpperCase())) {
    throw new AppError("Invalid blood group", 400);
  }

  if (referralCode && typeof referralCode !== "string") {
    throw new AppError("Referral code must be a string", 400);
  }

  if (referralCode && referralCode.trim().length > 20) {
    throw new AppError("Invalid referral code", 400);
  }
};

export const validateOtpInput = (email, otp) => {
  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new AppError("OTP must be 6 digits", 400);
  }
};

export const validateEmailOnly = (email) => {
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }
};

export const validateLoginInput = (email,password) => {
  if(!email || !password){
    throw new AppError("Email and password are required",400);
  }

   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }
}


export const validateForgotPasswordInput = (email) => {
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }
};

export const validateResetPasswordInput = (email, otp, newPassword, confirmPassword) => {
  if (!email || !otp || !newPassword || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new AppError("OTP must be 6 digits", 400);
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