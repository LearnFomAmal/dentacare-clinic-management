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
  default: 500,
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
  isEmailVerified: {
    type: Boolean,
    default: false,
  },

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

verification: {
  status: {
    type: String,
    enum: ["not_submitted", "pending", "approved", "rejected"],
    default: "not_submitted",
    index: true,
  },

  submittedAt: {
    type: Date,
    default: null,
  },

  reviewedAt: {
    type: Date,
    default: null,
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },

  rejectionReason: {
    type: String,
    default: "",
    trim: true,
    maxlength: 500,
  },
},

documents: {
  educationCertificate: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },

  qualificationCertificate: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },

  registrationCertificate: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },
},
  },
  { timestamps: true }
);
doctorSchema.index({
  "accountStatus.isEmailVerified": 1,
  "accountStatus.isVerified": 1,
  "verification.status": 1,
});

doctorSchema.index({
  email: 1,
  "accountStatus.isDeleted": 1,
});
const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;