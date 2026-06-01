import mongoose from "mongoose";

const referralConfigSchema = new mongoose.Schema(
  {
    refereeDiscountType: {
      type: String,
      enum: ["flat", "percentage"],
      default: "flat",
      required: true,
    },

    refereeDiscountValue: {
      type: Number,
      default: 100,
      min: 0,
      required: true,
    },

    maxDiscount: {
      type: Number,
      default: 100,
      min: 0,
    },

    minAppointmentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    referrerReward: {
      type: Number,
      default: 100,
      min: 0,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

const ReferralConfig = mongoose.model(
  "ReferralConfig",
  referralConfigSchema
);

export default ReferralConfig;