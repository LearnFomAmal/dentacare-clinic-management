import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      select: false,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["patient"],
      default: "patient",
    },

    personalInfo: {
      dateOfBirth: {
        type: Date,
        default: null,
      },

      gender: {
        type: String,
        enum: ["male", "female", "other", ""],
        default: "",
      },

      phoneNumber: {
        type: String,
        trim: true,
        default: "",
      },

      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
        default: "",
      },

      profileImage: {
        type: String,
        default: "",
      },
    },

    settings: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
    },

    referral: {
      referralCode: {
        type: String,
        unique: true,
        sparse: true,
      },

      referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      hasCompletedFirstAppointment: {
        type: Boolean,
        default: false,
      },
    },

    accountStatus: {
      isVerified: {
        type: Boolean,
        default: false,
      },

      isBlocked: {
        type: Boolean,
        default: false,
      },

      isDeleted: {
        type: Boolean,
        default: false,
      },
    },

    walletSummary: {
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalEarned: {
        type: Number,
        default: 0,
      },

      totalSpent: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;