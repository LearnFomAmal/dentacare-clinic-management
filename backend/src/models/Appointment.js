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

      paidAt: {
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
      },

      reason: {
        type: String,
        default: "",
      },

      rejectedAt: {
        type: Date,
        default: null,
      },
    },

    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["patient", "doctor", "admin", ""],
        default: "",
      },

      reasonType: {
        type: String,
        default: "",
      },

      reason: {
        type: String,
        default: "",
      },

      cancelledAt: {
        type: Date,
        default: null,
      },
    },

    completedAt: {
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