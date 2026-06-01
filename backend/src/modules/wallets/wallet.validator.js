import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateTopupInput = (body) => {
  const { amount, paymentMethod, transactionId } = body;

  const numericAmount = Number(amount);

  if (!amount || Number.isNaN(numericAmount)) {
    throw new AppError("Top-up amount is required", 400);
  }

  if (numericAmount < 10) {
    throw new AppError("Minimum top-up amount is ₹10", 400);
  }

  if (numericAmount > 50000) {
    throw new AppError("Maximum top-up amount is ₹50,000", 400);
  }

  const validMethods = ["google_pay", "phonepe", "upi", "razorpay"];

  if (!paymentMethod || !validMethods.includes(paymentMethod)) {
    throw new AppError("Invalid top-up payment method", 400);
  }

  if (!transactionId || !transactionId.trim()) {
    throw new AppError("Transaction id is required", 400);
  }

  if (transactionId.trim().length < 6) {
    throw new AppError("Transaction id must be at least 6 characters", 400);
  }
};

export const validateTransactionQuery = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);

  return {
    page,
    limit,
  };
};