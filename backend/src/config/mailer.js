import nodemailer from "nodemailer";
import { env } from "./env.js";
import AppError from "../shared/errors/AppError.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const sendOtpMail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: email,
      subject: "DentaCare OTP Verification",
      html: `
        <h2>DentaCare Account Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `,
    });
  } catch (error) {
    throw new AppError("Failed to send OTP email", 500);
  }
};