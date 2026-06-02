import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
      index: true,
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
      default: null,
      index: true,
    },

    uploadedBy: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
      default: "patient",
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    reportType: {
      type: String,
      enum: ["xray", "prescription", "lab_report", "medical_history", "other"],
      default: "other",
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    prescriptionText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    file: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },

      originalName: {
        type: String,
        default: "",
      },

      mimeType: {
        type: String,
        default: "",
      },

      size: {
        type: Number,
        default: 0,
      },
    },

    status: {
      type: String,
      enum: ["draft", "attached", "deleted"],
      default: "draft",
      index: true,
    },

    isVisibleToDoctor: {
      type: Boolean,
      default: true,
    },

    isVisibleToPatient: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({
  appointmentId: 1,
  status: 1,
  reportType: 1,
});

const Report = mongoose.model("Report", reportSchema);

export default Report;