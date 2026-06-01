import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateReferralConfigInput = (body) => {
  const {
    refereeDiscountType,
    refereeDiscountValue,
    maxDiscount,
    minAppointmentAmount,
    referrerReward,
    isActive,
  } = body;

  if (
    refereeDiscountType !== undefined &&
    !["flat", "percentage"].includes(refereeDiscountType)
  ) {
    throw new AppError("Invalid referee discount type", 400);
  }

  if (
    refereeDiscountValue !== undefined &&
    Number(refereeDiscountValue) < 0
  ) {
    throw new AppError("Referral discount value cannot be negative", 400);
  }

  if (
    refereeDiscountType === "percentage" &&
    Number(refereeDiscountValue) > 100
  ) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  if (maxDiscount !== undefined && Number(maxDiscount) < 0) {
    throw new AppError("Max discount cannot be negative", 400);
  }

  if (
    minAppointmentAmount !== undefined &&
    Number(minAppointmentAmount) < 0
  ) {
    throw new AppError("Minimum appointment amount cannot be negative", 400);
  }

  if (referrerReward !== undefined && Number(referrerReward) < 0) {
    throw new AppError("Referrer reward cannot be negative", 400);
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw new AppError("isActive must be boolean", 400);
  }
};