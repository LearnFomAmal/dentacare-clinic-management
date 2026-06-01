import mongoose from "mongoose";

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
  markPaymentAsRefunded,
  updateUserWalletSummary,
} from "./wallet.repository.js";

import {
  validateObjectId,
  validateTopupInput,
  validateTransactionQuery,
} from "./wallet.validator.js";

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

  const { page, limit } = validateTransactionQuery(query);
  const skip = (page - 1) * limit;

  const [transactions, totalTransactions] = await Promise.all([
    findWalletTransactions({
      userId,
      skip,
      limit,
    }),
    countWalletTransactions(userId),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
    },
  };
};

export const topupWalletService = async ({ userId, body }) => {
  validateObjectId(userId, "user id");
  validateTopupInput(body);

  const amount = Number(body.amount);
  const paymentMethod = body.paymentMethod;
  const transactionId = body.transactionId.trim();

  const session = await mongoose.startSession();

  try {
    let finalWallet = null;
    let finalTransaction = null;

    await session.withTransaction(async () => {
      const duplicatePayment = await findPaymentByTransactionId({
        transactionId,
        session,
      });

      if (duplicatePayment) {
        throw new AppError("Duplicate transaction id", 400);
      }

      const wallet = await findOrCreateWallet({
        userId,
        session,
      });

      const creditedWallet = await creditWallet({
        walletId: wallet._id,
        amount,
        session,
      });

      finalTransaction = await createWalletTransaction({
        payload: {
          walletId: creditedWallet._id,
          userId,
          type: "credit",
          amount,
          reason: "topup",
          referenceType: "topup",
          referenceId: null,
          status: "success",
          balanceAfter: creditedWallet.balance,
          description: `Wallet top-up via ${paymentMethod}`,
        },
        session,
      });

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

  const payment = await findPaidPaymentByAppointmentId({
    appointmentId: appointment._id,
    session,
  });

  if (!payment) {
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

  const refundedPayment = await markPaymentAsRefunded({
    paymentId: payment._id,
    refundedAmount: refundAmount,
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