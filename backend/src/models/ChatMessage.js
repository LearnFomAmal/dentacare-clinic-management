import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    senderRole: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
      index: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    receiverRole: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
      index: true,
    },

    messageType: {
      type: String,
      enum: ["text"],
      default: "text",
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
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
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({
  chatId: 1,
  createdAt: 1,
});

chatMessageSchema.index({
  receiverId: 1,
  receiverRole: 1,
  isRead: 1,
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;