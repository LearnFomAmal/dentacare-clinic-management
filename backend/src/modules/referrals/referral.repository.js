import Appointment from "../../models/Appointment.js";
import Referral from "../../models/Referral.js";
import ReferralConfig from "../../models/ReferralConfig.js";
import User from "../../models/User.js";

export const createReferral = (payload) => {
  return Referral.create(payload);
};

export const findReferralByReferredUser = ({
  referredUserId,
  session = null,
}) => {
  return Referral.findOne({
    referredUserId,
  }).session(session);
};

export const findPendingReferralByReferredUser = ({
  referredUserId,
  session = null,
}) => {
  return Referral.findOne({
    referredUserId,
    status: "pending",
    discountUsedAt: null,
    firstAppointmentId: null,
  }).session(session);
};

export const hasSuccessfulReferralDiscountAppointment = ({
  referredUserId,
  referralId,
  session = null,
}) => {
  return Appointment.exists({
    patientId: referredUserId,
    "pricing.appliedReferralId": referralId,
    "pricing.referralDiscount": {
      $gt: 0,
    },
    paymentStatus: {
      $in: ["paid", "refunded"],
    },
    status: {
      $in: ["pending", "approved", "completed", "cancelled", "rejected", "expired"],
    },
  }).session(session);
};

export const findReferralForPayment = ({
  referralId,
  referredUserId,
  session = null,
}) => {
  return Referral.findOne({
    _id: referralId,
    referredUserId,
    status: "pending",
    discountUsedAt: null,
    firstAppointmentId: null,
  }).session(session);
};

export const markReferralDiscountUsed = ({
  referralId,
  referredUserId,
  appointmentId,
  refereeDiscount,
  referrerReward,
  session = null,
}) => {
  return Referral.findOneAndUpdate(
    {
      _id: referralId,
      referredUserId,
      status: "pending",
      discountUsedAt: null,
      firstAppointmentId: null,
    },
    {
      status: "discount_used",
      firstAppointmentId: appointmentId,
      refereeDiscount,
      referrerReward,
      rewardStatus: "not_ready",
      discountUsedAt: new Date(),
    },
    {
      new: true,
      session,
    }
  );
};

export const getLatestReferralConfig = () => {
  return ReferralConfig.findOne().sort({ createdAt: -1 }).lean();
};

export const getActiveReferralConfig = ({ session = null } = {}) => {
  return ReferralConfig.findOne({
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .session(session);
};

export const upsertReferralConfig = ({
  payload,
  adminId = null,
}) => {
  return ReferralConfig.findOneAndUpdate(
    {},
    {
      ...payload,
      updatedBy: adminId,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const findMyReferralStats = async (userId) => {
  const [totalReferred, pending, discountUsed, completed] =
    await Promise.all([
      Referral.countDocuments({
        referrerId: userId,
      }),
      Referral.countDocuments({
        referrerId: userId,
        status: "pending",
      }),
      Referral.countDocuments({
        referrerId: userId,
        status: "discount_used",
      }),
      Referral.countDocuments({
        referrerId: userId,
        status: "completed",
      }),
    ]);

  return {
    totalReferred,
    pending,
    discountUsed,
    completed,
  };
};

export const findMyReferralHistory = (userId) => {
  return Referral.find({
    referrerId: userId,
  })
    .populate("referredUserId", "username email personalInfo createdAt")
    .populate(
      "firstAppointmentId",
      "appointmentDate status paymentStatus pricing"
    )
    .sort({ createdAt: -1 })
    .lean();
};

export const findAdminReferrals = ({
  filter = {},
  skip = 0,
  limit = 10,
}) => {
  return Referral.find(filter)
    .populate("referrerId", "username email personalInfo")
    .populate("referredUserId", "username email personalInfo")
    .populate(
      "firstAppointmentId",
      "appointmentDate status paymentStatus pricing"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAdminReferrals = (filter = {}) => {
  return Referral.countDocuments(filter);
};

export const findUserByReferralCode = (code) => {
  return User.findOne({
    "referral.referralCode": code.trim().toUpperCase(),
    "accountStatus.isDeleted": false,
  });
};

export const findUserReferralProfile = (userId) => {
  return User.findById(userId).select(
    "_id username email referral accountStatus walletSummary createdAt"
  );
};

export const findUserByIdForReferral = (userId) => {
  return User.findById(userId).select(
    "_id username email referral accountStatus"
  );
};

export const findReferralByReferredUserForProfile = ({
  referredUserId,
}) => {
  return Referral.findOne({
    referredUserId,
  })
    .select(
      "_id status firstAppointmentId discountUsedAt refereeDiscount rewardStatus"
    )
    .lean();
};