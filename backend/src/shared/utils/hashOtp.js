import bcrypt from "bcryptjs";

export const hashOtp = async (otp) => {
  return bcrypt.hash(otp, 10);
};

export const compareOtp = async (
  enteredOtp,
  hashedOtp
) => {
  return bcrypt.compare(
    enteredOtp,
    hashedOtp
  );
};