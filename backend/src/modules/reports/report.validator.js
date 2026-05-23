import mongoose from "mongoose";
import AppError from "../../shared/errors/AppError.js";

const VALID_REPORT_TYPES = [
  "xray",
  "prescription",
  "lab_report",
  "medical_history",
  "other",
];

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateUploadReportInput = (body, file) => {
  const { title, reportType } = body;

  if (!title || !title.trim()) {
    throw new AppError("Report title is required", 400);
  }

  if (title.trim().length < 2) {
    throw new AppError("Report title must be at least 2 characters", 400);
  }

  if (title.trim().length > 100) {
    throw new AppError("Report title cannot exceed 100 characters", 400);
  }

  if (reportType && !VALID_REPORT_TYPES.includes(reportType)) {
    throw new AppError("Invalid report type", 400);
  }

  if (!file) {
    throw new AppError("Report file is required", 400);
  }

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError("Only JPG, PNG, WEBP and PDF files are allowed", 400);
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new AppError("Report file must be less than 5MB", 400);
  }
};