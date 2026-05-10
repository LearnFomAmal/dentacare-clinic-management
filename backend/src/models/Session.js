import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
   },

    refreshToken: {
      type: String,
      required: true,
    },

    userAgent: {
      type: String,
      default: "",
    },

    userType: {
   type: String,
   enum: ["user", "doctor", "admin"],
   required: true,
},

    ipAddress: {
      type: String,
      default: "",
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isRevoked: {
      type: Boolean,
      default: false,
    },
    lastUsedAt: {
  type: Date,
  default: Date.now,
},
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
const Session = mongoose.model("Session", sessionSchema);

export default Session;