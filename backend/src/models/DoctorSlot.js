import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
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

    type: {
      type: String,
      enum: ["default", "extra"],
      default: "default",
    },

    status: {
      type: String,
      enum: ["available", "reserved", "booked", "blocked"],
      default: "available",
    },

    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reservedAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    reservedUntil: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

const doctorSlotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
      trim: true,
    },

    dayOfWeek: {
      type: String,
      required: true,
      trim: true,
    },

    isHoliday: {
      type: Boolean,
      default: false,
    },

    slots: {
      type: [slotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

doctorSlotSchema.index(
  {
    doctorId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

const DoctorSlot = mongoose.model("DoctorSlot", doctorSlotSchema);

export default DoctorSlot;