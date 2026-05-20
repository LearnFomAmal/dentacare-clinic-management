import AppError from "../../shared/errors/AppError.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9]\d{9}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;

const validateEmail = (email) => {
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }
};

const validateOtp = (otp) => {
  if (!otp) {
    throw new AppError("OTP is required", 400);
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new AppError("OTP must be 6 digits", 400);
  }
};

// ==============================
// CREATE DOCTOR VALIDATION
// ==============================
export const validateCreateDoctorInput = (data) => {
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

  if (
    !firstName ||
    !lastName ||
    !email ||
    !specializationId ||
    experience === undefined ||
    experience === null ||
    !education ||
    consultationFee === undefined ||
    consultationFee === null ||
    !contactNumber
  ) {
    throw new AppError("All fields are required", 400);
  }

  if (firstName.trim().length < 2 || firstName.trim().length > 30) {
    throw new AppError("First name must be 2-30 characters", 400);
  }

  if (lastName.trim().length < 1 || lastName.trim().length > 30) {
    throw new AppError("Last name must be 1-30 characters", 400);
  }

  validateEmail(email);

  if (!phoneRegex.test(contactNumber)) {
    throw new AppError("Invalid contact number", 400);
  }

  const experienceNumber = Number(experience);

  if (Number.isNaN(experienceNumber)) {
    throw new AppError("Experience must be a number", 400);
  }

  if (experienceNumber < 0) {
    throw new AppError("Experience cannot be negative", 400);
  }

  if (experienceNumber > 25) {
    throw new AppError("Experience cannot be more than 25 years", 400);
  }

  if (education.trim().length < 2 || education.trim().length > 100) {
    throw new AppError("Education must be 2-100 characters", 400);
  }

  const feeNumber = Number(consultationFee);

  if (Number.isNaN(feeNumber)) {
    throw new AppError("Consultation fee must be a number", 400);
  }

  if (feeNumber < 0) {
    throw new AppError("Consultation fee cannot be negative", 400);
  }

  if (feeNumber > 10000) {
    throw new AppError("Consultation fee cannot be more than ₹10000", 400);
  }
};

// ==============================
// LOGIN VALIDATION
// ==============================
export const validateDoctorLoginInput = (email, password) => {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  validateEmail(email);
};

// ==============================
// UPDATE PROFILE VALIDATION
// ==============================
export const validateDoctorProfileUpdateInput = (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new AppError("No update data provided", 400);
  }

  if (data.firstName !== undefined) {
    if (data.firstName.trim().length < 2 || data.firstName.trim().length > 30) {
      throw new AppError("First name must be 2-30 characters", 400);
    }
  }

  if (data.lastName !== undefined) {
    if (data.lastName.trim().length < 1 || data.lastName.trim().length > 30) {
      throw new AppError("Last name must be 1-30 characters", 400);
    }
  }

  if (data.professionalInfo?.contactNumber !== undefined) {
    if (!phoneRegex.test(data.professionalInfo.contactNumber)) {
      throw new AppError("Invalid contact number", 400);
    }
  }

  if (data.professionalInfo?.consultationFee !== undefined) {
    const feeNumber = Number(data.professionalInfo.consultationFee);

    if (Number.isNaN(feeNumber)) {
      throw new AppError("Consultation fee must be a number", 400);
    }

    if (feeNumber < 0) {
      throw new AppError("Consultation fee cannot be negative", 400);
    }

    if (feeNumber > 10000) {
      throw new AppError("Consultation fee cannot be more than ₹10000", 400);
    }
  }

  if (data.professionalInfo?.experience !== undefined) {
    const experienceNumber = Number(data.professionalInfo.experience);

    if (Number.isNaN(experienceNumber)) {
      throw new AppError("Experience must be a number", 400);
    }

    if (experienceNumber < 0) {
      throw new AppError("Experience cannot be negative", 400);
    }

    if (experienceNumber > 25) {
      throw new AppError("Experience cannot be more than 25 years", 400);
    }
  }
};

// ==============================
// CHANGE PASSWORD VALIDATION
// ==============================
export const validateDoctorChangePasswordInput = (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("All password fields are required", 400);
  }

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

// ==============================
// THEME VALIDATION
// ==============================
export const validateDoctorThemeInput = (theme) => {
  if (!["light", "dark"].includes(theme)) {
    throw new AppError("Invalid theme", 400);
  }
};

// ==============================
// DOCTOR VERIFICATION VALIDATION
// ==============================
export const validateDoctorVerificationInput = (
  email,
  otp,
  newPassword,
  confirmPassword
) => {
  validateEmail(email);
  validateOtp(otp);

  if (!newPassword || !confirmPassword) {
    throw new AppError("Password fields are required", 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  if (!passwordRegex.test(newPassword)) {
    throw new AppError(
      "Password must be 8-20 chars with uppercase, lowercase, number and special character",
      400
    );
  }
};

// ==============================
// RESEND OTP VALIDATION
// ==============================
export const validateDoctorResendOtpInput = (email) => {
  validateEmail(email);
};

// ==============================
// FORGOT PASSWORD VALIDATION
// ==============================
export const validateDoctorForgotPasswordInput = (email) => {
  validateEmail(email);
};

// ==============================
// RESET PASSWORD VALIDATION
// ==============================
export const validateDoctorResetPasswordInput = (
  email,
  otp,
  newPassword,
  confirmPassword
) => {
  validateEmail(email);
  validateOtp(otp);

  if (!newPassword || !confirmPassword) {
    throw new AppError("Password fields are required", 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  if (!passwordRegex.test(newPassword)) {
    throw new AppError(
      "Password must be 8-20 chars with uppercase, lowercase, number and special character",
      400
    );
  }
};

// ==============================
// CONSULTATION FEE VALIDATION
// ==============================
export const validateDoctorConsultationFeeInput = (consultationFee) => {
  if (
    consultationFee === undefined ||
    consultationFee === null ||
    consultationFee === ""
  ) {
    throw new AppError("Consultation fee is required", 400);
  }

  const feeNumber = Number(consultationFee);

  if (Number.isNaN(feeNumber)) {
    throw new AppError("Consultation fee must be a number", 400);
  }

  if (feeNumber < 0) {
    throw new AppError("Consultation fee cannot be negative", 400);
  }

  if (feeNumber > 10000) {
    throw new AppError("Consultation fee cannot be more than ₹10000", 400);
  }
};