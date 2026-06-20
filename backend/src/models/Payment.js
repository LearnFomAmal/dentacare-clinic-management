import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
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

    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      default: null,
    },

    rewardRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardRule",
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["google_pay", "phonepe", "upi", "wallet", "razorpay"],
      required: true,
    },

    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    razorpay: {
      orderId: {
        type: String,
        default: "",
        trim: true,
        
      },

      paymentId: {
        type: String,
        default: "",
        trim: true,
      },

      signature: {
        type: String,
        default: "",
        trim: true,
      },
    },

    status: {
      type: String,
      enum: ["paid", "failed", "refunded"],
      required: true,
      index: true,
    },

    failureReason: {
      type: String,
      default: "",
      trim: true,
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


paymentSchema.index(
  {
    appointmentId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "paid",
    },
  }
);

paymentSchema.index(
  {
    "razorpay.paymentId": 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      "razorpay.paymentId": {
        $gt: "",
      },
    },
  }
);

paymentSchema.index(
  {
    "razorpay.orderId": 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      "razorpay.orderId": {
        $gt: "",
      },
    },
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;