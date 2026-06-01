import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      enum: [
        "topup",
        "booking_payment",
        "refund",
        "referral_reward",
        "admin_adjustment",
      ],
      required: true,
      index: true,
    },

    referenceType: {
      type: String,
      enum: ["appointment", "payment", "referral", "admin", "topup", ""],
      default: "",
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
      index: true,
    },

    balanceAfter: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({
  userId: 1,
  createdAt: -1,
});

const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);

export default WalletTransaction;