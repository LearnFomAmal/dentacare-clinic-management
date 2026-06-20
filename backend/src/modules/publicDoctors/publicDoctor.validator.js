import mongoose from "mongoose";
import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateDateString = (date) => {
  if (!date) {
    throw new AppError("Date is required", 400);
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(date)) {
    throw new AppError("Date must be in YYYY-MM-DD format", 400);
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Invalid date", 400);
  }
};

export const validatePagination = ({ page, limit }) => {
  const finalPage = Number(page) || 1;
  const finalLimit = Number(limit) || 9;

  if (finalPage < 1) {
    throw new AppError("Page must be greater than 0", 400);
  }

  if (finalLimit < 1 || finalLimit > 30) {
    throw new AppError("Limit must be between 1 and 30", 400);
  }

  return {
    page: finalPage,
    limit: finalLimit,
  };
};

export const validateMinRating = (minRating) => {
  if (minRating === undefined || minRating === null || minRating === "") {
    return;
  }

  const numericRating = Number(minRating);

  if (
    Number.isNaN(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new AppError("Minimum rating must be between 1 and 5", 400);
  }
};