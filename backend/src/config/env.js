import dotenv from "dotenv";

dotenv.config();
const requiredEnvVariables = [
  "MONGO_URI",
  "ACCESS_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRES",
  "REFRESH_TOKEN_SECRET",
  "REFRESH_TOKEN_EXPIRES",
  "FRONTEND_URL",
  "EMAIL_USER",
  "EMAIL_PASS",
  "GOOGLE_CLIENT_ID",
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

CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,

CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,

CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  EMAIL_USER: process.env.EMAIL_USER,

  EMAIL_PASS: process.env.EMAIL_PASS,

  RAZORPAY_KEY_ID:
    process.env.RAZORPAY_KEY_ID,

  RAZORPAY_KEY_SECRET:
    process.env.RAZORPAY_KEY_SECRET,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  FRONTEND_URL:
    process.env.FRONTEND_URL,
};