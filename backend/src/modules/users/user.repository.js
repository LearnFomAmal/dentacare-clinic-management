import User from "../../models/User.js";

export const findUserByEmail = (email) => {
  return User.findOne({ email });
};

export const findUserByReferralCode = (referralCode) => {
  return User.findOne({ "referral.referralCode": referralCode });
};

export const createUser = (payload) => {
  return User.create(payload);
};

export const findUserById = (id) => {
  return User.findById(id);
};


export const findUserByEmailWithPassword = (email) => {
  return User.findOne({ email }).select("+password");
};

export const updateUserPasswordByEmail = (email, hashedPassword) => {
  return User.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true }
  );
};