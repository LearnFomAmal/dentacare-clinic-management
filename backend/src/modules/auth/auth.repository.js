import Otp from "../../models/Otp.js";

export const findOtpRecord = (email, purpose) => {
  return Otp.findOne({
    email,
    purpose,
  }).sort({ createdAt: -1 });
};

export const findUnusedOtpRecord = (email, purpose) => {
  return Otp.findOne({
    email,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });
};

export const createOtpRecord = (payload) => {
  return Otp.create(payload);
};

export const deleteOldOtps = (email, purpose) => {
  return Otp.deleteMany({ email, purpose });
};

export const updateOtpRecord = (id, payload) => {
  return Otp.findByIdAndUpdate(id, payload, {
    new: true,
  });
};