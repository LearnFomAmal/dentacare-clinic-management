import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validatePagination = ({ page, limit }) => {
  const finalPage = Number(page) || 1;
  const finalLimit = Number(limit) || 20;

  if (finalPage < 1) {
    throw new AppError("Page must be greater than 0", 400);
  }

  if (finalLimit < 1 || finalLimit > 50) {
    throw new AppError("Limit must be between 1 and 50", 400);
  }

  return {
    page: finalPage,
    limit: finalLimit,
  };
};

export const validateRecipientRole = (role) => {
  if (!["patient", "doctor", "admin"].includes(role)) {
    throw new AppError("Invalid recipient role", 400);
  }
};

export const validateNotificationPayload = (payload) => {
  if (!payload?.recipientRole) {
    throw new AppError("Recipient role is required", 400);
  }

  validateRecipientRole(payload.recipientRole);

  if (payload.recipientRole !== "admin" && !payload.recipientId) {
    throw new AppError("Recipient id is required", 400);
  }

  if (!payload.type || !payload.type.trim()) {
    throw new AppError("Notification type is required", 400);
  }

  if (!payload.title || !payload.title.trim()) {
    throw new AppError("Notification title is required", 400);
  }

  if (!payload.message || !payload.message.trim()) {
    throw new AppError("Notification message is required", 400);
  }

  if (payload.recipientId) {
    validateObjectId(payload.recipientId, "recipient id");
  }

  if (payload.actorId) {
    validateObjectId(payload.actorId, "actor id");
  }

  if (payload.referenceId) {
    validateObjectId(payload.referenceId, "reference id");
  }
};