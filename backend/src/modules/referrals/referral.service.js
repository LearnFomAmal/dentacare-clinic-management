import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

import {
  countAdminReferrals,
  createReferral,
  findAdminReferrals,
  findMyReferralHistory,
  findMyReferralStats,
  findPendingReferralByReferredUser,
  findReferralByReferredUser,
  findUserByIdForReferral,
  findUserByReferralCode,
  findUserReferralProfile,
  getActiveReferralConfig,
  getLatestReferralConfig,
  upsertReferralConfig,
} from "./referral.repository.js";

import {
  validateObjectId,
  validateReferralConfigInput,
} from "./referral.validator.js";

const REFERRAL_CODE_PREFIX = "DENTA";

const normalizeReferralCode = (code = "") => {
  return String(code).trim().toUpperCase();
};

export const calculateReferralDiscount = ({
  config,
  amount,
}) => {
  const numericAmount = Number(amount);

  if (!config || !config.isActive) {
    return 0;
  }

  if (numericAmount < Number(config.minAppointmentAmount || 0)) {
    return 0;
  }

  let discount = 0;

  if (config.refereeDiscountType === "flat") {
    discount = Number(config.refereeDiscountValue || 0);
  }

  if (config.refereeDiscountType === "percentage") {
    discount =
      (numericAmount * Number(config.refereeDiscountValue || 0)) / 100;

    if (Number(config.maxDiscount || 0) > 0) {
      discount = Math.min(discount, Number(config.maxDiscount));
    }
  }

  discount = Math.min(discount, numericAmount);

  return Math.floor(discount);
};

export const generateUniqueReferralCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `${REFERRAL_CODE_PREFIX}${randomPart}`;

    const existingUser = await findUserByReferralCode(code);

    if (!existingUser) {
      return code;
    }
  }

  throw new AppError("Failed to generate referral code. Please retry.", 500);
};

export const validateReferralCodeForRegistration = async ({
  referralCode,
  email,
}) => {
  const code = normalizeReferralCode(referralCode);

  if (!code) {
    return null;
  }

  const referrer = await findUserByReferralCode(code);

  if (!referrer) {
    throw new AppError("Invalid referral code", 400);
  }

  if (referrer.email?.toLowerCase() === String(email).toLowerCase()) {
    throw new AppError("You cannot use your own referral code", 400);
  }

  if (referrer.accountStatus?.isBlocked) {
    throw new AppError("Referral code is not active", 400);
  }

  if (referrer.accountStatus?.isDeleted) {
    throw new AppError("Referral code is not active", 400);
  }

  return referrer;
};

export const createReferralAfterRegistration = async ({
  referrerId,
  referredUserId,
  referralCode,
}) => {
  if (!referrerId || !referredUserId) {
    return null;
  }

  const existingReferral = await findReferralByReferredUser({
    referredUserId,
  });

  if (existingReferral) {
    return existingReferral;
  }

  return createReferral({
    referrerId,
    referredUserId,
    referralCode: normalizeReferralCode(referralCode),
    status: "pending",
    rewardStatus: "not_ready",
  });
};

export const getReferralDiscountForAppointment = async ({
  patient,
  appointmentAmount,
}) => {
  if (!patient?.referral?.referredBy) {
    return {
      referralDiscount: 0,
      appliedReferralId: null,
    };
  }

  if (patient.referral?.hasCompletedFirstAppointment) {
    return {
      referralDiscount: 0,
      appliedReferralId: null,
    };
  }

  const referral = await findPendingReferralByReferredUser({
    referredUserId: patient._id,
  });

  if (!referral) {
    return {
      referralDiscount: 0,
      appliedReferralId: null,
    };
  }

  const config = await getActiveReferralConfig();

  if (!config) {
    return {
      referralDiscount: 0,
      appliedReferralId: null,
    };
  }

  const referralDiscount = calculateReferralDiscount({
    config,
    amount: appointmentAmount,
  });

  if (referralDiscount <= 0) {
    return {
      referralDiscount: 0,
      appliedReferralId: null,
    };
  }

  return {
    referralDiscount,
    appliedReferralId: referral._id,
  };
};

export const getMyReferralService = async ({ userId }) => {
  validateObjectId(userId, "user id");

  const user = await findUserReferralProfile(userId);

  if (!user || user.accountStatus?.isDeleted) {
    throw new AppError("User not found", 404);
  }

  const [stats, config, referredByUser] = await Promise.all([
    findMyReferralStats(userId),
    getLatestReferralConfig(),
    user.referral?.referredBy
      ? findUserByIdForReferral(user.referral.referredBy)
      : null,
  ]);

  return {
    referralCode: user.referral?.referralCode || "",
    referredBy: referredByUser
      ? {
          _id: referredByUser._id,
          username: referredByUser.username,
          email: referredByUser.email,
        }
      : null,
    hasCompletedFirstAppointment:
      user.referral?.hasCompletedFirstAppointment || false,
    walletSummary: user.walletSummary || {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    },
    stats,
    config: config
      ? {
          refereeDiscountType: config.refereeDiscountType,
          refereeDiscountValue: config.refereeDiscountValue,
          maxDiscount: config.maxDiscount,
          minAppointmentAmount: config.minAppointmentAmount,
          referrerReward: config.referrerReward,
          isActive: config.isActive,
        }
      : null,
  };
};

export const getMyReferralHistoryService = async ({ userId }) => {
  validateObjectId(userId, "user id");

  return findMyReferralHistory(userId);
};

export const getAdminReferralsService = async ({ query }) => {
  const {
    page = 1,
    limit = 10,
    status = "",
    rewardStatus = "",
  } = query;

  const numericPage = Math.max(Number(page), 1);
  const numericLimit = Math.min(Math.max(Number(limit), 1), 50);
  const skip = (numericPage - 1) * numericLimit;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (rewardStatus) {
    filter.rewardStatus = rewardStatus;
  }

  const [referrals, totalReferrals] = await Promise.all([
    findAdminReferrals({
      filter,
      skip,
      limit: numericLimit,
    }),
    countAdminReferrals(filter),
  ]);

  return {
    referrals,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      totalReferrals,
      totalPages: Math.ceil(totalReferrals / numericLimit),
    },
  };
};

export const getReferralConfigService = async () => {
  const config = await getLatestReferralConfig();

  if (!config) {
    return {
      refereeDiscountType: "flat",
      refereeDiscountValue: 100,
      maxDiscount: 100,
      minAppointmentAmount: 0,
      referrerReward: 100,
      isActive: true,
    };
  }

  return config;
};

export const updateReferralConfigService = async ({
  adminId,
  body,
}) => {
  validateReferralConfigInput(body);

  const payload = {};

  const allowedFields = [
    "refereeDiscountType",
    "refereeDiscountValue",
    "maxDiscount",
    "minAppointmentAmount",
    "referrerReward",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  if (payload.refereeDiscountValue !== undefined) {
    payload.refereeDiscountValue = Number(payload.refereeDiscountValue);
  }

  if (payload.maxDiscount !== undefined) {
    payload.maxDiscount = Number(payload.maxDiscount);
  }

  if (payload.minAppointmentAmount !== undefined) {
    payload.minAppointmentAmount = Number(payload.minAppointmentAmount);
  }

  if (payload.referrerReward !== undefined) {
    payload.referrerReward = Number(payload.referrerReward);
  }

  return upsertReferralConfig({
    payload,
    adminId: adminId ? new mongoose.Types.ObjectId(adminId) : null,
  });
};