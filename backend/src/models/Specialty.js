import mongoose from "mongoose";

const specialtySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

specialtySchema.index({
  name: 1,
});

const Specialty = mongoose.model(
  "Specialty",
  specialtySchema
);

export default Specialty;