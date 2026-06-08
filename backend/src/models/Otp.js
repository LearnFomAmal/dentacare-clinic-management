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
    enum: ["register", "forgot_password", "doctor_verify", "doctor_forgot_password", "admin_forgot_password"],
    required: true,
  },

  attempts: {
    type: Number,
    default: 0,
    max: 5,
  },

  resendCount: {
    type: Number,
    default: 0,
    max: 5,
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

  // Store hashed password for security
  password: String,

  dateOfBirth: Date,
  gender: String,
  phoneNumber: String,
  bloodGroup: String,

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  referralCodeUsed: {
    type: String,
    uppercase: true,
    trim: true,
    default: "",
  },
},
  doctorId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Doctor",
  default: null,
},
  createdAt: {
    type: Date,
    default: Date.now,
  },

});

otpSchema.index({
  email: 1,
  purpose: 1,
  isUsed: 1,
});

otpSchema.index({
  expiresAt: 1,
}, {
  expireAfterSeconds: 0,
});


const Otp = mongoose.model("Otp", otpSchema);

export default Otp;