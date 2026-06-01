import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

const VALID_PAYMENT_METHODS = [
  "google_pay",
  "phonepe",
  "upi",
  "wallet",
];

export const validateObjectId = (id, fieldName = "id") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validatePaymentSuccessInput = (body) => {
  const { appointmentId, paymentMethod, transactionId } = body;

  validateObjectId(appointmentId, "appointment id");

  if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new AppError("Invalid payment method", 400);
  }

  if (!transactionId || !transactionId.trim()) {
    throw new AppError("Transaction id is required", 400);
  }

  if (transactionId.trim().length < 6) {
    throw new AppError("Transaction id must be at least 6 characters", 400);
  }
};

export const validatePaymentFailedInput = (body) => {
  const {
    appointmentId,
    paymentMethod,
    transactionId,
    failureReason,
  } = body;

  validateObjectId(appointmentId, "appointment id");

  if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new AppError("Invalid payment method", 400);
  }

  if (!transactionId || !transactionId.trim()) {
    throw new AppError("Transaction id is required", 400);
  }

  if (!failureReason || !failureReason.trim()) {
    throw new AppError("Failure reason is required", 400);
  }
};