import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../../config/env.js";
import AppError from "../../shared/errors/AppError.js";

import {
  countWalletTransactions,
  createWalletTransaction,
  creditWallet,
  debitWalletSafely,
  findOrCreateWallet,
  findPaidPaymentByAppointmentId,
  findPaymentByTransactionId,
  findWalletTransactions,
  findSuccessfulTopupByRazorpayPaymentId,
  markPaymentAsRefunded,
  updateUserWalletSummary,
  findPendingTopupByOrderId,
markTopupTransactionSuccess,
findSuccessfulWalletTransactionByReference,
findActiveWalletUserById,
markPendingTopupCancelledByOrderId,
} from "./wallet.repository.js";

import {
  validateCreateWalletRazorpayOrderInput,
  validateObjectId,
  validateTransactionQuery,
  validateVerifyWalletRazorpayInput,
  validateCancelWalletRazorpayTopupInput,
} from "./wallet.validator.js";
const getRazorpayInstance = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay credentials are not configured", 500);
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};
export const getMyWalletService = async ({ userId }) => {
  validateObjectId(userId, "user id");

  const wallet = await findOrCreateWallet({
    userId,
  });

  return {
    _id: wallet._id,
    userId: wallet.userId,
    balance: wallet.balance,
    totalCredited: wallet.totalCredited,
    totalDebited: wallet.totalDebited,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
};

export const getMyWalletTransactionsService = async ({
  userId,
  query,
}) => {
  validateObjectId(userId, "user id");

  const { page, limit, reason, status } = validateTransactionQuery(query);
  const skip = (page - 1) * limit;

  const [transactions, totalTransactions] = await Promise.all([
    findWalletTransactions({
      userId,
      skip,
      limit,
      reason,
      status,
    }),
    countWalletTransactions({
      userId,
      reason,
      status,
    }),
  ]);

  return {
    transactions,
    filters: {
      reason,
      status,
    },
    pagination: {
      page,
      limit,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
    },
  };
};

export const createWalletRazorpayOrderService = async ({
  userId,
  body,
}) => {
  validateObjectId(userId, "user id");

  const { amount } = validateCreateWalletRazorpayOrderInput(body);

  const razorpay = getRazorpayInstance();

  const amountInPaise = Math.round(amount * 100);

  const shortReceipt = `wlt_${Date.now().toString().slice(-10)}_${Math.floor(
    Math.random() * 1000
  )}`;

  const session = await mongoose.startSession();

  try {
    let finalOrder = null;
    let pendingTransaction = null;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: env.RAZORPAY_CURRENCY || "INR",
      receipt: shortReceipt,
      notes: {
        purpose: "wallet_topup",
        userId: userId.toString(),
        amount: amount.toString(),
      },
    });

    await session.withTransaction(async () => {
      const wallet = await findOrCreateWallet({
        userId,
        session,
      });

      pendingTransaction = await createWalletTransaction({
        payload: {
          walletId: wallet._id,
          userId,
          type: "credit",
          amount,
          reason: "topup",
          referenceType: "topup",
          referenceId: null,
          status: "pending",
          balanceAfter: wallet.balance,
          description: "Pending wallet top-up via Razorpay",
          gateway: {
            provider: "razorpay",
            orderId: order.id,
            paymentId: "",
            signature: "",
          },
        },
        session,
      });

      finalOrder = order;
    });

    return {
      keyId: env.RAZORPAY_KEY_ID,
      orderId: finalOrder.id,
      amount: finalOrder.amount,
      currency: finalOrder.currency,
      walletAmount: amount,
      pendingTransactionId: pendingTransaction._id,
      name: "DentaCare",
      description: "DentaCare wallet top-up",
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(
        "Wallet top-up order already exists. Please try again.",
        400
      );
    }

    throw new AppError(
      error?.error?.description ||
        error?.message ||
        "Failed to create Razorpay wallet order",
      400
    );
  } finally {
    await session.endSession();
  }
};

export const verifyWalletRazorpayTopupService = async ({
  userId,
  body,
}) => {
  validateObjectId(userId, "user id");

  const {
    amount,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = validateVerifyWalletRazorpayInput(body);

  if (!env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay secret is not configured", 500);
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  const session = await mongoose.startSession();

  try {
    let finalWallet = null;
    let finalTransaction = null;

    await session.withTransaction(async () => {
      const duplicateTopup =
        await findSuccessfulTopupByRazorpayPaymentId({
          razorpayPaymentId,
          session,
        });

      if (duplicateTopup) {
        throw new AppError("This wallet top-up is already processed", 400);
      }

      const pendingTopup = await findPendingTopupByOrderId({
        userId,
        razorpayOrderId,
        session,
      });

      if (!pendingTopup) {
        throw new AppError(
          "No pending wallet top-up found for this Razorpay order",
          400
        );
      }

      const storedAmount = Number(pendingTopup.amount || 0);

      if (storedAmount <= 0) {
        throw new AppError("Invalid stored wallet top-up amount", 400);
      }

      if (Number(amount) !== storedAmount) {
        throw new AppError(
          "Wallet top-up amount mismatch",
          400
        );
      }

      const creditedWallet = await creditWallet({
        walletId: pendingTopup.walletId,
        amount: storedAmount,
        session,
      });

      finalTransaction = await markTopupTransactionSuccess({
        transactionId: pendingTopup._id,
        razorpayPaymentId,
        razorpaySignature,
        balanceAfter: creditedWallet.balance,
        session,
      });
      if (!finalTransaction) {
  throw new AppError("Wallet top-up is no longer pending", 400);
}
      await updateUserWalletSummary({
        userId,
        wallet: creditedWallet,
        session,
      });

      finalWallet = creditedWallet;
    });

    return {
      wallet: finalWallet,
      transaction: finalTransaction,
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(
        "This wallet top-up is already processed",
        400
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const processBookingWalletDebit = async ({
  userId,
  appointment,
  amount,
  session = null,
}) => {
  const numericAmount = Number(amount || 0);

  if (numericAmount <= 0) {
    return null;
  }
  const existingDebit = await findSuccessfulWalletTransactionByReference({
  userId,
  reason: "booking_payment",
  referenceType: "appointment",
  referenceId: appointment._id,
  session,
});

if (existingDebit) {
  throw new AppError("Wallet payment already processed for this appointment", 400);
}
  const wallet = await findOrCreateWallet({
    userId,
    session,
  });

  const debitedWallet = await debitWalletSafely({
    walletId: wallet._id,
    amount: numericAmount,
    session,
  });
  
  if (!debitedWallet) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  const transaction = await createWalletTransaction({
    payload: {
      walletId: debitedWallet._id,
      userId,
      type: "debit",
      amount: numericAmount,
      reason: "booking_payment",
      referenceType: "appointment",
      referenceId: appointment._id,
      status: "success",
      balanceAfter: debitedWallet.balance,
      description: "Appointment booking payment from wallet",
    },
    session,
  });

  await updateUserWalletSummary({
    userId,
    wallet: debitedWallet,
    session,
  });

  return {
    wallet: debitedWallet,
    transaction,
  };
};

export const refundAppointmentPaymentToWallet = async ({
  appointment,
  reason = "Appointment rejected. Refund credited to wallet.",
  session = null,
}) => {
  const refundAmount = Number(appointment?.pricing?.finalAmount || 0);

  if (refundAmount <= 0) {
    return null;
  }

  const existingRefund = await findSuccessfulWalletTransactionByReference({
    userId: appointment.patientId,
    reason: "refund",
    referenceType: "appointment",
    referenceId: appointment._id,
    session,
  });

  if (existingRefund) {
    return null;
  }

  const payment = await findPaidPaymentByAppointmentId({
    appointmentId: appointment._id,
    session,
  });

  if (!payment) {
    return null;
  }

  const refundedPayment = await markPaymentAsRefunded({
    paymentId: payment._id,
    refundedAmount: refundAmount,
    session,
  });

  if (!refundedPayment) {
    return null;
  }

  const wallet = await findOrCreateWallet({
    userId: appointment.patientId,
    session,
  });

  const creditedWallet = await creditWallet({
    walletId: wallet._id,
    amount: refundAmount,
    session,
  });

  const transaction = await createWalletTransaction({
    payload: {
      walletId: creditedWallet._id,
      userId: appointment.patientId,
      type: "credit",
      amount: refundAmount,
      reason: "refund",
      referenceType: "appointment",
      referenceId: appointment._id,
      status: "success",
      balanceAfter: creditedWallet.balance,
      description: reason,
    },
    session,
  });

  await updateUserWalletSummary({
    userId: appointment.patientId,
    wallet: creditedWallet,
    session,
  });

  return {
    wallet: creditedWallet,
    transaction,
    payment: refundedPayment,
  };
};

export const creditReferralRewardToWallet = async ({
  userId,
  referralId,
  amount,
  session = null,
}) => {
  const numericAmount = Number(amount || 0);

  if (numericAmount <= 0) {
    return null;
  }

  const rewardableUser = await findActiveWalletUserById({
    userId,
    session,
  });

  if (!rewardableUser) {
    return null;
  }

  const existingReward = await findSuccessfulWalletTransactionByReference({
    userId,
    reason: "referral_reward",
    referenceType: "referral",
    referenceId: referralId,
    session,
  });

  if (existingReward) {
    return null;
  }

  const wallet = await findOrCreateWallet({
    userId,
    session,
  });

  const creditedWallet = await creditWallet({
    walletId: wallet._id,
    amount: numericAmount,
    session,
  });

  const transaction = await createWalletTransaction({
    payload: {
      walletId: creditedWallet._id,
      userId,
      type: "credit",
      amount: numericAmount,
      reason: "referral_reward",
      referenceType: "referral",
      referenceId: referralId,
      status: "success",
      balanceAfter: creditedWallet.balance,
      description: "Referral reward credited",
    },
    session,
  });

  await updateUserWalletSummary({
    userId,
    wallet: creditedWallet,
    session,
  });

  return {
    wallet: creditedWallet,
    transaction,
  };
};

export const cancelWalletRazorpayTopupService = async ({
  userId,
  body,
}) => {
  validateObjectId(userId, "user id");

  const { razorpayOrderId } = validateCancelWalletRazorpayTopupInput(body);

  const session = await mongoose.startSession();

  try {
    let cancelledTransaction = null;

    await session.withTransaction(async () => {
      cancelledTransaction = await markPendingTopupCancelledByOrderId({
        userId,
        razorpayOrderId,
        session,
      });
    });

    return {
      cancelled: Boolean(cancelledTransaction),
      transaction: cancelledTransaction,
    };
  } finally {
    await session.endSession();
  }
};