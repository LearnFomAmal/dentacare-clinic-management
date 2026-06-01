import mongoose from "mongoose";
import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateCreateCouponInput = (body) => {
  const {
    code,
    title,
    discountType,
    discountValue,
    maxDiscount = 0,
    minAmount = 0,
    validFrom,
    validTo,
    maxUsage = 0,
    maxUsagePerUser = 1,
  } = body;

  if (!code || !code.trim()) {
    throw new AppError("Coupon code is required", 400);
  }

  if (!title || !title.trim()) {
    throw new AppError("Coupon title is required", 400);
  }

  if (!["flat", "percentage"].includes(discountType)) {
    throw new AppError("Discount type must be flat or percentage", 400);
  }

  if (Number(discountValue) <= 0) {
    throw new AppError("Discount value must be greater than 0", 400);
  }

  if (discountType === "percentage" && Number(discountValue) > 100) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  if (Number(maxDiscount) < 0) {
    throw new AppError("Max discount cannot be negative", 400);
  }

  if (Number(minAmount) < 0) {
    throw new AppError("Minimum amount cannot be negative", 400);
  }

  if (!validFrom || !validTo) {
    throw new AppError("Valid from and valid to dates are required", 400);
  }

  const fromDate = new Date(validFrom);
  const toDate = new Date(validTo);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new AppError("Invalid coupon validity dates", 400);
  }

  if (fromDate >= toDate) {
    throw new AppError("Valid to date must be after valid from date", 400);
  }

  if (Number(maxUsage) < 0) {
    throw new AppError("Max usage cannot be negative", 400);
  }

  if (Number(maxUsagePerUser) < 1) {
    throw new AppError("Max usage per user must be at least 1", 400);
  }

  if (body.applicableSpecialtyId) {
    validateObjectId(body.applicableSpecialtyId, "specialty id");
  }
};

export const validateUpdateCouponInput = (body) => {
  if (body.code !== undefined && !body.code.trim()) {
    throw new AppError("Coupon code cannot be empty", 400);
  }

  if (body.title !== undefined && !body.title.trim()) {
    throw new AppError("Coupon title cannot be empty", 400);
  }

  if (
    body.discountType !== undefined &&
    !["flat", "percentage"].includes(body.discountType)
  ) {
    throw new AppError("Discount type must be flat or percentage", 400);
  }

  if (body.discountValue !== undefined && Number(body.discountValue) <= 0) {
    throw new AppError("Discount value must be greater than 0", 400);
  }

  if (
    body.discountType === "percentage" &&
    Number(body.discountValue) > 100
  ) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  if (body.applicableSpecialtyId) {
    validateObjectId(body.applicableSpecialtyId, "specialty id");
  }
};

export const validateCouponCodeInput = (body) => {
  if (!body.couponCode || !body.couponCode.trim()) {
    throw new AppError("Coupon code is required", 400);
  }

  if (!body.doctorId) {
    throw new AppError("Doctor id is required", 400);
  }

  validateObjectId(body.doctorId, "doctor id");

  if (body.appointmentAmount === undefined || Number(body.appointmentAmount) < 0) {
    throw new AppError("Valid appointment amount is required", 400);
  }
};