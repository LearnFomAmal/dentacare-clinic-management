import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "discount_used", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    firstAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    firstCompletedAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    refereeDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    referrerReward: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardStatus: {
      type: String,
      enum: ["not_ready", "pending_wallet_credit", "credited", "failed"],
      default: "not_ready",
      index: true,
    },

    discountUsedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    rewardedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

referralSchema.index({
  referrerId: 1,
  status: 1,
});

const Referral = mongoose.model("Referral", referralSchema);

export default Referral;