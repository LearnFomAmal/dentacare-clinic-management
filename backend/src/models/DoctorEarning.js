import mongoose from "mongoose";

const doctorEarningSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
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
      required: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    referralDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    earnedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["google_pay", "phonepe", "upi", "wallet", "razorpay"],
      required: true,
    },

    transactionId: {
      type: String,
      required: true,
      trim: true,
    },

    appointmentDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    earningStatus: {
      type: String,
      enum: ["earned", "refunded", "cancelled"],
      default: "earned",
      index: true,
    },

    earnedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

doctorEarningSchema.index(
  {
    appointmentId: 1,
  },
  {
    unique: true,
  }
);

doctorEarningSchema.index({
  doctorId: 1,
  earnedAt: -1,
});

doctorEarningSchema.index({
  doctorId: 1,
  earningStatus: 1,
});

const DoctorEarning = mongoose.model("DoctorEarning", doctorEarningSchema);

export default DoctorEarning;