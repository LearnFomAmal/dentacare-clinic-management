import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(20, "Password must be less than 20 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[@$!%*?&]/, "Password must contain special character");

export const patientProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[A-Za-z ]+$/, "Username must contain only letters and spaces"),

  personalInfo: z.object({
    dateOfBirth: z.string().optional(),

    gender: z
      .enum(["male", "female", "other"])
      .optional()
      .or(z.literal("")),

    phoneNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter valid 10 digit Indian phone number")
      .optional()
      .or(z.literal("")),

    bloodGroup: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .optional()
      .or(z.literal("")),

    profileImage: z.string().optional().or(z.literal("")),
  }),
});

export const doctorProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name must be less than 30 characters"),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(30, "Last name must be less than 30 characters"),

  professionalInfo: z.object({
    experience: z.coerce
      .number()
      .min(0, "Experience cannot be negative"),

    education: z
      .string()
      .min(2, "Education is required"),

    contactNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter valid 10 digit Indian phone number"),

    profileImage: z.string().optional().or(z.literal("")),
  }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),

    newPassword: passwordSchema,

    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const themeSchema = z.object({
  theme: z.enum(["light", "dark"], {
    message: "Theme is required",
  }),
});