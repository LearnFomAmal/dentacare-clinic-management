import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    recipientRole: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    actorRole: {
      type: String,
      enum: ["patient", "doctor", "admin", "system", ""],
      default: "",
    },

    actorName: {
      type: String,
      default: "",
      trim: true,
    },

    actorProfileImage: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    referenceType: {
      type: String,
      enum: [
        "appointment",
        "payment",
        "review",
        "referral",
        "report",
        "doctor",
        "coupon",
        "banner",
        "system",
        "",
      ],
      default: "",
      index: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  recipientRole: 1,
  recipientId: 1,
  isRead: 1,
  isDeleted: 1,
  createdAt: -1,
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;