import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validatePagination = ({ page, limit }) => {
  const finalPage = Number(page) || 1;
  const finalLimit = Number(limit) || 10;

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

export const validateReviewStatus = (status) => {
  if (!status) return;

  if (!["pending", "approved", "rejected"].includes(status)) {
    throw new AppError("Invalid review status", 400);
  }
};

export const validateRatingFilter = (rating) => {
  if (rating === undefined || rating === null || rating === "") {
    return;
  }

  const numericRating = Number(rating);

  if (
    Number.isNaN(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new AppError("Rating filter must be between 1 and 5", 400);
  }
};

export const validateRatingInput = (rating) => {
  const numericRating = Number(rating);

  if (
    Number.isNaN(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }
};

export const validateCreateReviewInput = (body) => {
  const { appointmentId, rating, description } = body;

  if (!appointmentId) {
    throw new AppError("Appointment id is required", 400);
  }

  validateObjectId(appointmentId, "appointment id");

  validateRatingInput(rating);

  if (!description || !description.trim()) {
    throw new AppError("Review description is required", 400);
  }

  if (description.trim().length < 5) {
    throw new AppError(
      "Review description must be at least 5 characters",
      400
    );
  }

  if (description.trim().length > 1000) {
    throw new AppError(
      "Review description cannot exceed 1000 characters",
      400
    );
  }
};

export const validateUpdateReviewInput = (body) => {
  if (!body || Object.keys(body).length === 0) {
    throw new AppError("No update data provided", 400);
  }

  if (body.rating !== undefined) {
    validateRatingInput(body.rating);
  }

  if (body.description !== undefined) {
    if (!body.description || !body.description.trim()) {
      throw new AppError("Review description cannot be empty", 400);
    }

    if (body.description.trim().length < 5) {
      throw new AppError(
        "Review description must be at least 5 characters",
        400
      );
    }

    if (body.description.trim().length > 1000) {
      throw new AppError(
        "Review description cannot exceed 1000 characters",
        400
      );
    }
  }
};

export const validateRejectReviewInput = (body) => {
  if (!body?.rejectionReason || !body.rejectionReason.trim()) {
    throw new AppError("Rejection reason is required", 400);
  }

  if (body.rejectionReason.trim().length < 5) {
    throw new AppError(
      "Rejection reason must be at least 5 characters",
      400
    );
  }

  if (body.rejectionReason.trim().length > 500) {
    throw new AppError(
      "Rejection reason cannot exceed 500 characters",
      400
    );
  }
};