import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["referral", "specialty_coupon"],
      required: true,
      index: true,
    },

    locations: {
      type: [String],
      enum: ["home", "doctors"],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one banner location is required",
      },
      index: true,
    },

    ctaText: {
      type: String,
      default: "View Offer",
      trim: true,
      maxlength: 50,
    },

    redirectUrl: {
      type: String,
      default: "",
      trim: true,
    },

    specialtyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialty",
      default: null,
      index: true,
    },

    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
      index: true,
    },

    couponCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    priority: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({
  type: 1,
  isActive: 1,
  isDeleted: 1,
});

bannerSchema.index({
  locations: 1,
  priority: 1,
});

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;