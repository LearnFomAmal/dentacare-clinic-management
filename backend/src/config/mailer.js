import nodemailer from "nodemailer";
import { env } from "./env.js";
import AppError from "../shared/errors/AppError.js";
const OTP_EXPIRY_MINUTES = 5;
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
        <p>This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      `,
    });
  } catch (error) {
    throw new AppError("Failed to send OTP email", 500);
  }
};

export const sendDoctorVerificationMail = async (
  email,
  otp,
  tempPassword
) => {
  try {
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: email,
      subject: "DentaCare Doctor Account Verification",
      html: `
        <h2>Doctor Account Created</h2>

        <p>Your temporary password:</p>
        <h3>${tempPassword}</h3>

        <p>Your OTP verification code:</p>
        <h1>${otp}</h1>

       <p>Please verify your email using this OTP and set your new password.</p>
<p>After login, upload your certificates for admin verification.</p>
      `,
    });
  } catch (error) {
    throw new AppError(
      "Failed to send doctor verification email",
      500
    );
  }
};

export const resendDoctorOtpMail =
  async (email, otp) => {
    try {
      await transporter.sendMail({
        from: env.EMAIL_USER,

        to: email,

        subject:
          "DentaCare Doctor OTP Resend",

        html: `
          <h2>Doctor Verification OTP</h2>

          <p>Your new OTP:</p>

          <h1>${otp}</h1>

          <p>
            OTP expires in ${OTP_EXPIRY_MINUTES} minutes
          </p>
        `,
      });
    } catch (error) {
      throw new AppError(
        "Failed to resend OTP email",
        500
      );
    }
  };

  export const sendDoctorForgotPasswordOtpMail =
  async (email, otp) => {
    try {
      await transporter.sendMail({
        from: env.EMAIL_USER,

        to: email,

        subject:
          "DentaCare Doctor Password Reset",

        html: `
          <h2>Password Reset OTP</h2>

          <p>Your OTP:</p>

          <h1>${otp}</h1>

          <p>
            OTP expires in ${OTP_EXPIRY_MINUTES} minutes
          </p>
        `,
      });
    } catch (error) {
      throw new AppError(
        "Failed to send forgot password OTP",
        500
      );
    }
  };

export const sendAdminForgotPasswordOtpMail =
  async (email, otp) => {
    try {
      await transporter.sendMail({
        from: env.EMAIL_USER,

        to: email,

        subject:
          "DentaCare Admin Password Reset",

        html: `
          <h2>Admin Password Reset</h2>

          <p>Your OTP:</p>

          <h1>${otp}</h1>

          <p>
            OTP expires in ${OTP_EXPIRY_MINUTES} minutes
          </p>
        `,
      });
    } catch (error) {
      throw new AppError(
        "Failed to send admin forgot password OTP",
        500
      );
    }
  };

  export const sendDoctorRegisterOtpMail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: email,
      subject: "DentaCare Doctor Registration OTP",
      html: `
        <h2>Doctor Registration Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      `,
    });
  } catch (error) {
    throw new AppError("Failed to send doctor registration OTP", 500);
  }
};

export const sendDoctorVerificationApprovedMail = async (email) => {
  try {
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: email,
      subject: "DentaCare Doctor Verification Approved",
      html: `
        <h2>Verification Approved</h2>
        <p>Your doctor documents have been approved by admin.</p>
        <p>You can now manage slots and receive appointments.</p>
      `,
    });
  } catch (error) {
    throw new AppError("Failed to send doctor approval email", 500);
  }
};

export const sendDoctorVerificationRejectedMail = async (
  email,
  reason
) => {
  try {
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: email,
      subject: "DentaCare Doctor Verification Rejected",
      html: `
        <h2>Verification Rejected</h2>
        <p>Your doctor document verification was rejected.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please upload valid documents again.</p>
      `,
    });
  } catch (error) {
    throw new AppError("Failed to send doctor rejection email", 500);
  }
};