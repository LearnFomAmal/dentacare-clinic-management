import mongoose from "mongoose";

import Payment from "../../models/Payment.js";
import User from "../../models/User.js";
import Wallet from "../../models/Wallet.js";
import WalletTransaction from "../../models/WalletTransaction.js";

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
}) => {
  return WalletTransaction.find({
    userId,
  })
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countWalletTransactions = (userId) => {
  return WalletTransaction.countDocuments({
    userId,
  });
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