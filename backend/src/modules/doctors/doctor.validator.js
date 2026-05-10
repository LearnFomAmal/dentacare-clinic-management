import AppError from "../../shared/errors/AppError.js";


// CREATE DOCTOR VALIDATION
export const validateCreateDoctorInput = (
  data
) => {
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
    !education ||
    consultationFee === undefined ||
    !contactNumber
  ) {
    throw new AppError(
      "All fields are required",
      400
    );
  }

  const phoneRegex =
    /^[6-9]\d{9}$/;

  if (
    !phoneRegex.test(contactNumber)
  ) {
    throw new AppError(
      "Invalid contact number",
      400
    );
  }

  if (experience < 0) {
    throw new AppError(
      "Experience cannot be negative",
      400
    );
  }

  if (consultationFee < 0) {
    throw new AppError(
      "Consultation fee cannot be negative",
      400
    );
  }
  if (!emailRegex.test(email)) {
  throw new AppError(
    "Invalid email format",
    400
  );
}
};
// LOGIN VALIDATION
export const validateDoctorLoginInput = (email, password) => {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }
};


// UPDATE PROFILE VALIDATION
export const validateDoctorProfileUpdateInput = (data) => {
  if (!data) return;

  if (data.professionalInfo?.contactNumber) {
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(data.professionalInfo.contactNumber)) {
      throw new AppError("Invalid contact number", 400);
    }
  }
  if (!emailRegex.test(email)) {
  throw new AppError(
    "Invalid email format",
    400
  );
}
  if (
    data.professionalInfo?.consultationFee !== undefined &&
    data.professionalInfo.consultationFee < 0
  ) {
    throw new AppError("Consultation fee cannot be negative", 400);
  }

  if (
    data.professionalInfo?.experience !== undefined &&
    data.professionalInfo.experience < 0
  ) {
    throw new AppError("Experience cannot be negative", 400);
  }
};


// CHANGE PASSWORD VALIDATION
export const validateDoctorChangePasswordInput = (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("All password fields are required", 400);
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


// THEME VALIDATION
export const validateDoctorThemeInput = (theme) => {
  if (!["light", "dark"].includes(theme)) {
    throw new AppError("Invalid theme", 400);
  }
};


export const validateDoctorVerificationInput = (
  email,
  otp,
  newPassword,
  confirmPassword
) => {
  if (
    !email ||
    !otp ||
    !newPassword ||
    !confirmPassword
  ) {
    throw new AppError(
      "All fields are required",
      400
    );
  }
if (!/^\d{6}$/.test(otp)) {
  throw new AppError(
    "OTP must be 6 digits",
    400
  );
}
  if (newPassword !== confirmPassword) {
    throw new AppError(
      "Passwords do not match",
      400
    );
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;

  if (!passwordRegex.test(newPassword)) {
    throw new AppError(
      "Password must be strong",
      400
    );
  }
};

export const validateDoctorResendOtpInput =
  (email) => {
    if (!email) {
      throw new AppError(
        "Email is required",
        400
      );
    }
    if (!emailRegex.test(email)) {
  throw new AppError(
    "Invalid email format",
    400
  );
}
  };


  export const validateDoctorForgotPasswordInput =
  (email) => {

    if (!email) {
      throw new AppError(
        "Email is required",
        400
      );
    }
    if (!emailRegex.test(email)) {
  throw new AppError(
    "Invalid email format",
    400
  );
}
  };

  export const validateDoctorResetPasswordInput =
  (
    email,
    otp,
    newPassword,
    confirmPassword
  ) => {

    if (
      !email ||
      !otp ||
      !newPassword ||
      !confirmPassword
    ) {
      throw new AppError(
        "All fields are required",
        400
      );
    }
  if (!/^\d{6}$/.test(otp)) {
  throw new AppError(
    "OTP must be 6 digits",
    400
  );
}
    if (
      newPassword !==
      confirmPassword
    ) {
      throw new AppError(
        "Passwords do not match",
        400
      );
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;

    if (
      !passwordRegex.test(
        newPassword
      )
    ) {
      throw new AppError(
        "Password must be strong",
        400
      );
    }
    if (!emailRegex.test(email)) {
  throw new AppError(
    "Invalid email format",
    400
  );
}
  };
  
export const validateDoctorConsultationFeeInput = (consultationFee) => {
  if (consultationFee === undefined || consultationFee === null || consultationFee === "") {
    throw new AppError("Consultation fee is required", 400);
  }

  const feeNumber = Number(consultationFee);

  if (Number.isNaN(feeNumber)) {
    throw new AppError("Consultation fee must be a number", 400);
  }

  if (feeNumber < 0) {
    throw new AppError("Consultation fee cannot be negative", 400);
  }
  if (!Number.isInteger(feeNumber)) {
  throw new AppError(
    "Consultation fee must be whole number",
    400
  );
}

if (feeNumber > 10000) {
  throw new AppError(
    "Consultation fee too high",
    400
  );
}
};
