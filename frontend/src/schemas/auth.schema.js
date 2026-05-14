import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(20, "Password must be less than 20 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[@$!%*?&]/, "Password must contain special character");

export const loginSchema = z.object({
  accountType: z.enum(["patient", "doctor", "admin"], {
    message: "Account type is required",
  }),

  email: emailSchema,

  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(/^[A-Za-z ]+$/, "Username must contain only letters and spaces"),

    email: emailSchema,

    password: passwordSchema,

    confirmPassword: z.string().min(1, "Confirm password is required"),

   dateOfBirth: z
  .string()
  .min(1, "Date of birth is required")
  .refine((value) => {
    const dob = new Date(value);
    const today = new Date();

    if (Number.isNaN(dob.getTime())) {
      return false;
    }

    if (dob > today) {
      return false;
    }

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    return age >= 6;
  }, "Patient must be at least 6 years old"),

    gender: z.enum(["male", "female", "other"], {
      message: "Gender is required",
    }),

    phoneNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter valid 10 digit Indian phone number"),

    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
      message: "Blood group is required",
    }),

    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export const forgotPasswordSchema = z.object({
  accountType: z.enum(["patient", "doctor", "admin"], {
    message: "Account type is required",
  }),

  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    accountType: z.enum(["patient", "doctor", "admin"], {
      message: "Account type is required",
    }),

    email: emailSchema,

    otp: z
      .string()
      .min(6, "OTP must be 6 digits")
      .max(6, "OTP must be 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only numbers"),

    newPassword: passwordSchema,

    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const doctorVerificationSchema = z
  .object({
    email: emailSchema,

    otp: z
      .string()
      .min(6, "OTP must be 6 digits")
      .max(6, "OTP must be 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only numbers"),

    newPassword: passwordSchema,

    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });