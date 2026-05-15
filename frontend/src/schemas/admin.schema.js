import { z } from "zod";

export const specialtySchema = z.object({
  name: z
    .string()
    .min(2, "Specialty name must be at least 2 characters")
    .max(45, "Specialty name must be less than 50 characters"),

  description: z
    .string()
    .max(300, "Description must be less than 300 characters")
    .optional()
    .or(z.literal("")),
});

const phoneRegex = /^[6-9]\d{9}$/;

export const createDoctorSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name must be less than 30 characters"),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(30, "Last name must be less than 30 characters"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),

  specializationId: z
    .string()
    .min(1, "Specialty is required"),

  experience: z.coerce
    .number()
    .min(0, "Experience cannot be negative"),

  education: z
    .string()
    .min(2, "Education is required")
    .max(100, "Education must be less than 100 characters"),

  consultationFee: z.coerce
    .number()
    .min(0, "Consultation fee cannot be negative"),

  contactNumber: z
    .string()
    .regex(phoneRegex, "Enter valid 10 digit Indian phone number"),
});

export const editConsultationFeeSchema = z.object({
  consultationFee: z.coerce
    .number()
    .min(0, "Consultation fee cannot be negative"),
});