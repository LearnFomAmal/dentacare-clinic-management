import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },

  otp: {
    type: String,
    required: true,
  },

  purpose: {
    type: String,
    enum: ["register", "forgot_password"],
    required: true,
  },

  attempts: {
    type: Number,
    default: 0,
  },

  resendCount: {
    type: Number,
    default: 0,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  resendAvailableAt: {
    type: Date,
    required: true,
  },

  isUsed: {
    type: Boolean,
    default: false,
  },
  tempUserData: {
  username: String,
  password: String,
  dateOfBirth: Date,
  gender: String,
  phoneNumber: String,
  bloodGroup: String,
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  }
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;