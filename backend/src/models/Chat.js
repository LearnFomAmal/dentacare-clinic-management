import mongoose from "mongoose";

const lastMessageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: "",
      trim: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    senderRole: {
      type: String,
      enum: ["patient", "doctor", ""],
      default: "",
    },

    sentAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
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

    lastMessage: {
      type: lastMessageSchema,
      default: () => ({}),
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },

    patientUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    doctorUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({
  patientId: 1,
  lastMessageAt: -1,
});

chatSchema.index({
  doctorId: 1,
  lastMessageAt: -1,
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;