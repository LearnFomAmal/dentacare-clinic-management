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