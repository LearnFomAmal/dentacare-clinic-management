import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateChatRole = (role) => {
  if (!["patient", "doctor"].includes(role)) {
    throw new AppError("Invalid chat role", 403);
  }
};

export const validatePagination = ({ page, limit }) => {
  const finalPage = Number(page) || 1;
  const finalLimit = Number(limit) || 30;

  if (finalPage < 1) {
    throw new AppError("Page must be greater than 0", 400);
  }

  if (finalLimit < 1 || finalLimit > 100) {
    throw new AppError("Limit must be between 1 and 100", 400);
  }

  return {
    page: finalPage,
    limit: finalLimit,
  };
};

export const validateSendMessageInput = (body) => {
  const text = String(body?.text || "").trim();

  if (!text) {
    throw new AppError("Message text is required", 400);
  }

  if (text.length > 1000) {
    throw new AppError("Message cannot exceed 1000 characters", 400);
  }

  return {
    text,
  };
};