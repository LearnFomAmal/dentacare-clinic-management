import mongoose from "mongoose";

import Payment from "../../models/Payment.js";
import User from "../../models/User.js";
import Wallet from "../../models/Wallet.js";
import WalletTransaction from "../../models/WalletTransaction.js";
export const markPendingTopupCancelledByOrderId = ({
  userId,
  razorpayOrderId,
  session = null,
}) => {
  return WalletTransaction.findOneAndUpdate(
    {
      userId,
      reason: "topup",
      referenceType: "topup",
      status: "pending",
      "gateway.orderId": razorpayOrderId,
    },
    {
      status: "cancelled",
      description: "Wallet top-up cancelled before payment completion",
    },
    {
      new: true,
      session,
    }
  );
};
export const findWalletByUserId = ({ userId, session = null }) => {
  return Wallet.findOne({
    userId,
  }).session(session);
};

export const createWallet = async ({ userId, session = null }) => {
  const wallets = await Wallet.create(
    [
      {
        userId,
        balance: 0,
        totalCredited: 0,
        totalDebited: 0,
      },
    ],
    { session }
  );

  return wallets[0];
};

export const findOrCreateWallet = async ({ userId, session = null }) => {
  let wallet = await findWalletByUserId({
    userId,
    session,
  });

  if (wallet) {
    return wallet;
  }

  try {
    wallet = await createWallet({
      userId,
      session,
    });

    return wallet;
  } catch (error) {
    if (error.code === 11000) {
      return findWalletByUserId({
        userId,
        session,
      });
    }

    throw error;
  }
};

export const creditWallet = ({
  walletId,
  amount,
  session = null,
}) => {
  return Wallet.findOneAndUpdate(
    {
      _id: walletId,
    },
    {
      $inc: {
        balance: amount,
        totalCredited: amount,
      },
    },
    {
      new: true,
      session,
    }
  );
};

export const debitWalletSafely = ({
  walletId,
  amount,
  session = null,
}) => {
  return Wallet.findOneAndUpdate(
    {
      _id: walletId,
      balance: {
        $gte: amount,
      },
    },
    {
      $inc: {
        balance: -amount,
        totalDebited: amount,
      },
    },
    {
      new: true,
      session,
    }
  );
};

export const createWalletTransaction = async ({
  payload,
  session = null,
}) => {
  const transactions = await WalletTransaction.create([payload], {
    session,
  });

  return transactions[0];
};

export const findWalletTransactions = ({
  userId,
  skip = 0,
  limit = 10,
  reason = "",
  status = "success",
}) => {
  const filter = {
    userId,
  };

  if (reason) {
    filter.reason = reason;
  }

  if (status && status !== "all") {
    filter.status = status;
  }

  return WalletTransaction.find(filter)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countWalletTransactions = ({
  userId,
  reason = "",
  status = "success",
}) => {
  const filter = {
    userId,
  };

  if (reason) {
    filter.reason = reason;
  }

  if (status && status !== "all") {
    filter.status = status;
  }

  return WalletTransaction.countDocuments(filter);
};

export const updateUserWalletSummary = ({
  userId,
  wallet,
  session = null,
}) => {
  return User.findByIdAndUpdate(
    userId,
    {
      "walletSummary.balance": wallet.balance,
      "walletSummary.totalEarned": wallet.totalCredited,
      "walletSummary.totalSpent": wallet.totalDebited,
    },
    {
      new: true,
      session,
    }
  );
};

export const findPaymentByTransactionId = ({
  transactionId,
  session = null,
}) => {
  return Payment.findOne({
    transactionId,
  }).session(session);
};

export const findPaidPaymentByAppointmentId = ({
  appointmentId,
  session = null,
}) => {
  return Payment.findOne({
    appointmentId,
    status: "paid",
  }).session(session);
};

export const markPaymentAsRefunded = ({
  paymentId,
  refundedAmount,
  session = null,
}) => {
  return Payment.findOneAndUpdate(
    {
      _id: paymentId,
      status: "paid",
    },
    {
      status: "refunded",
      refundedAmount,
      refundedAt: new Date(),
    },
    {
      new: true,
      session,
    }
  );
};

export const toObjectId = (id) => {
  return new mongoose.Types.ObjectId(id);
};



export const findPendingTopupByOrderId = ({
  userId,
  razorpayOrderId,
  session = null,
}) => {
  return WalletTransaction.findOne({
    userId,
    reason: "topup",
    referenceType: "topup",
    status: "pending",
    "gateway.orderId": razorpayOrderId,
  }).session(session);
};

export const findSuccessfulTopupByRazorpayPaymentId = ({
  razorpayPaymentId,
  session = null,
}) => {
  return WalletTransaction.findOne({
    reason: "topup",
    referenceType: "topup",
    status: "success",
    "gateway.paymentId": razorpayPaymentId,
  }).session(session);
};

export const markTopupTransactionSuccess = ({
  transactionId,
  razorpayPaymentId,
  razorpaySignature,
  balanceAfter,
  session = null,
}) => {
  return WalletTransaction.findOneAndUpdate(
    {
      _id: transactionId,
      reason: "topup",
      status: "pending",
    },
    {
      status: "success",
      balanceAfter,
      "gateway.paymentId": razorpayPaymentId,
      "gateway.signature": razorpaySignature,
    },
    {
      new: true,
      session,
    }
  );
};

export const findSuccessfulWalletTransactionByReference = ({
  userId,
  reason,
  referenceType,
  referenceId,
  session = null,
}) => {
  return WalletTransaction.findOne({
    userId,
    reason,
    referenceType,
    referenceId,
    status: "success",
  }).session(session);
};

export const findActiveWalletUserById = ({
  userId,
  session = null,
}) => {
  return User.findOne({
    _id: userId,
    "accountStatus.isDeleted": false,
    "accountStatus.isBlocked": false,
  }).session(session);
};