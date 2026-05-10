import dotenv from "dotenv";

dotenv.config();
const requiredEnvVariables = [
  "MONGO_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "FRONTEND_URL",
];

requiredEnvVariables.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

export const env = {
  PORT: process.env.PORT || 5000,

  NODE_ENV:
    process.env.NODE_ENV || "development",

  MONGO_URI: process.env.MONGO_URI,

  ACCESS_TOKEN_SECRET:
    process.env.ACCESS_TOKEN_SECRET,

  ACCESS_TOKEN_EXPIRES:
    process.env.ACCESS_TOKEN_EXPIRES,

  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET,

  REFRESH_TOKEN_EXPIRES:
    process.env.REFRESH_TOKEN_EXPIRES,

  CLOUDINARY_NAME:
    process.env.CLOUDINARY_NAME,

  CLOUDINARY_KEY:
    process.env.CLOUDINARY_KEY,

  CLOUDINARY_SECRET:
    process.env.CLOUDINARY_SECRET,

  EMAIL_USER: process.env.EMAIL_USER,

  EMAIL_PASS: process.env.EMAIL_PASS,

  RAZORPAY_KEY_ID:
    process.env.RAZORPAY_KEY_ID,

  RAZORPAY_KEY_SECRET:
    process.env.RAZORPAY_KEY_SECRET,

  FRONTEND_URL:
    process.env.FRONTEND_URL,
};