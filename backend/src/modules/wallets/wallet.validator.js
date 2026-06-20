import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateTopupAmount = (amount) => {
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

  return numericAmount;
};

export const validateCreateWalletRazorpayOrderInput = (body) => {
  const amount = validateTopupAmount(body.amount);

  return {
    amount,
  };
};

export const validateVerifyWalletRazorpayInput = (body) => {
  const amount = body.amount;

  const razorpayOrderId =
    body.razorpay_order_id || body.razorpayOrderId || "";

  const razorpayPaymentId =
    body.razorpay_payment_id || body.razorpayPaymentId || "";

  const razorpaySignature =
    body.razorpay_signature || body.razorpaySignature || "";

  const numericAmount = validateTopupAmount(amount);

  if (!razorpayOrderId || !String(razorpayOrderId).trim()) {
    throw new AppError("Razorpay order id is required", 400);
  }

  if (!razorpayPaymentId || !String(razorpayPaymentId).trim()) {
    throw new AppError("Razorpay payment id is required", 400);
  }

  if (!razorpaySignature || !String(razorpaySignature).trim()) {
    throw new AppError("Razorpay signature is required", 400);
  }

  return {
    amount: numericAmount,
    razorpayOrderId: String(razorpayOrderId).trim(),
    razorpayPaymentId: String(razorpayPaymentId).trim(),
    razorpaySignature: String(razorpaySignature).trim(),
  };
};

export const validateCancelWalletRazorpayTopupInput = (body) => {
  const razorpayOrderId =
    body.razorpay_order_id || body.razorpayOrderId || "";

  if (!razorpayOrderId || !String(razorpayOrderId).trim()) {
    throw new AppError("Razorpay order id is required", 400);
  }

  return {
    razorpayOrderId: String(razorpayOrderId).trim(),
  };
};

export const validateTransactionQuery = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);

  const reason = query.reason ? String(query.reason).trim() : "";
  const status = query.status ? String(query.status).trim() : "success";

  const allowedReasons = [
    "",
    "topup",
    "booking_payment",
    "refund",
    "referral_reward",
    "admin_adjustment",
  ];

  const allowedStatuses = [
    "all",
    "success",
    "pending",
    "failed",
    "cancelled",
  ];

  if (!allowedReasons.includes(reason)) {
    throw new AppError("Invalid wallet transaction reason filter", 400);
  }

  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid wallet transaction status filter", 400);
  }

  return {
    page,
    limit,
    reason,
    status,
  };
};