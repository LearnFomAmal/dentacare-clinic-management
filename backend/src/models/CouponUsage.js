import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    discountApplied: {
      type: Number,
      required: true,
      min: 0,
    },

    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed",
      index: true,
    },

    usedAt: {
      type: Date,
      default: Date.now,
    },

    releasedAt: {
  type: Date,
  default: null,
},

releaseReason: {
  type: String,
  default: "",
  trim: true,
},
  },
  { timestamps: true }
);

couponUsageSchema.index(
  {
    userId: 1,
    couponId: 1,
    appointmentId: 1,
  },
  {
    unique: true,
  }
);
couponUsageSchema.index({
  appointmentId: 1,
  couponId: 1,
  status: 1,
});

couponUsageSchema.index({
  userId: 1,
  couponId: 1,
  status: 1,
});
const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

export default CouponUsage;