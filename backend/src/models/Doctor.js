import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
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
      required: true,
      select: false,
    },

    specialization: {
      specialtyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialty",
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      displayName: {
        type: String,
        default: "",
        trim: true,
      },
    },

    professionalInfo: {
      experience: {
        type: Number,
        required: true,
        min: 0,
        max: 25,
      },

      education: {
        type: String,
        required: true,
        trim: true,
      },

      consultationFee: {
        type: Number,
        required: true,
        min: 0,
        max: 10000,
      },

      contactNumber: {
        type: String,
        required: true,
        trim: true,
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

    stats: {
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      totalReviews: {
        type: Number,
        default: 0,
      },

      totalPatients: {
        type: Number,
        default: 0,
      },

      totalAppointments: {
        type: Number,
        default: 0,
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

      mustChangePassword: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;