import mongoose from "mongoose";

const appointmentReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    reportType: {
      type: String,
      trim: true,
      default: "other",
    },

    fileUrl: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const rescheduleHistorySchema = new mongoose.Schema(
  {
    oldSlotDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorSlot",
      default: null,
    },

    oldSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    oldAppointmentDate: {
      type: String,
      default: "",
      trim: true,
    },

    oldStartTime: {
      type: String,
      default: "",
      trim: true,
    },

    oldEndTime: {
      type: String,
      default: "",
      trim: true,
    },

    newSlotDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorSlot",
      default: null,
    },

    newSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    newAppointmentDate: {
      type: String,
      default: "",
      trim: true,
    },

    newStartTime: {
      type: String,
      default: "",
      trim: true,
    },

    newEndTime: {
      type: String,
      default: "",
      trim: true,
    },

    reasonType: {
      type: String,
      default: "",
      trim: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    rescheduledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
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

    slotDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorSlot",
      required: true,
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    reports: {
      type: [appointmentReportSchema],
      default: [],
    },

    status: {
      type: String,
     enum: [
  "pending_payment",
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
  "expired",
],
      default: "pending_payment",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },

    pricing: {
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

      appliedCouponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
      },

      appliedCouponCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      appliedReferralId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Referral",
        default: null,
      },

      appliedRewardRuleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RewardRule",
        default: null,
      },
    },

    paymentSummary: {
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        default: null,
      },

      paymentMethod: {
        type: String,
        default: "",
      },

      transactionId: {
        type: String,
        default: "",
      },

      razorpayOrderId: {
        type: String,
        default: "",
      },

      paidAt: {
        type: Date,
        default: null,
      },
    },

    reservation: {
      reservedUntil: {
        type: Date,
        default: null,
      },

      releasedAt: {
        type: Date,
        default: null,
      },
    },

    approval: {
      approvedBy: {
        type: String,
        enum: ["doctor", "admin", ""],
        default: "",
      },

      approvedAt: {
        type: Date,
        default: null,
      },
    },

    rejection: {
      rejectedBy: {
        type: String,
        enum: ["doctor", "admin", ""],
        default: "",
      },

      reasonType: {
        type: String,
        default: "",
        trim: true,
      },

      reason: {
        type: String,
        default: "",
        trim: true,
      },

      rejectedAt: {
        type: Date,
        default: null,
      },
    },

    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["patient",  "admin", ""],
        default: "",
      },

      reasonType: {
        type: String,
        default: "",
        trim: true,
      },

      reason: {
        type: String,
        default: "",
        trim: true,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },
      refundEligible: {
  type: Boolean,
  default: false,
},

refundStatus: {
  type: String,
  enum: ["not_applicable", "eligible", "not_eligible", "refunded", "not_refunded"],
  default: "not_applicable",
},

refundPolicy: {
  type: String,
  default: "",
  trim: true,
},

    },

    reschedule: {
      rescheduleCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      lastRescheduledAt: {
        type: Date,
        default: null,
      },

      lastReason: {
        type: String,
        default: "",
        trim: true,
      },
    },

    rescheduleHistory: {
      type: [rescheduleHistorySchema],
      default: [],
    },

    completedAt: {
      type: Date,
      default: null,
    },
    expiredAt: {
     type: Date,
     default: null,
   },
  },
  { timestamps: true }
);

appointmentSchema.index({
  patientId: 1,
  doctorId: 1,
  appointmentDate: 1,
  slotId: 1,
  status: 1,
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;