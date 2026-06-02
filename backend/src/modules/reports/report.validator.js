import mongoose from "mongoose";
import AppError from "../../shared/errors/AppError.js";

const VALID_REPORT_TYPES = [
  "xray",
  "prescription",
  "lab_report",
  "medical_history",
  "other",
];

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const maxSize = 5 * 1024 * 1024;

export const validateObjectId = (id, fieldName = "id") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

const validateReportFile = (file) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError("Only JPG, PNG, WEBP and PDF files are allowed", 400);
  }

  if (file.size > maxSize) {
    throw new AppError("Report file must be less than 5MB", 400);
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

  validateReportFile(file);
};

export const validateDoctorPrescriptionInput = (body, file) => {
  const { title, prescriptionText, description } = body;

  if (!title || !title.trim()) {
    throw new AppError("Prescription title is required", 400);
  }

  if (title.trim().length < 2) {
    throw new AppError("Prescription title must be at least 2 characters", 400);
  }

  if (title.trim().length > 100) {
    throw new AppError("Prescription title cannot exceed 100 characters", 400);
  }

  if (!prescriptionText || !prescriptionText.trim()) {
    throw new AppError("Prescription text is required", 400);
  }

  if (prescriptionText.trim().length < 5) {
    throw new AppError("Prescription text must be at least 5 characters", 400);
  }

  if (prescriptionText.trim().length > 2000) {
    throw new AppError("Prescription text cannot exceed 2000 characters", 400);
  }

  if (description && description.trim().length > 500) {
    throw new AppError("Description cannot exceed 500 characters", 400);
  }

  if (file) {
    validateReportFile(file);
  }
};