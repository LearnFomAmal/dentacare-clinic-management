import Coupon from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";
import Doctor from "../../models/Doctor.js";
import Specialty from "../../models/Specialty.js";

export const createCoupon = (payload) => {
  return Coupon.create(payload);
};

export const findCouponByCode = ({
  code,
  includeDeleted = false,
  session = null,
}) => {
  const filter = {
    code: code.trim().toUpperCase(),
  };

  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  return Coupon.findOne(filter).session(session);
};

export const findCouponById = ({ couponId, session = null }) => {
  return Coupon.findOne({
    _id: couponId,
    isDeleted: false,
  }).session(session);
};

export const findCoupons = ({ filter, skip, limit }) => {
  return Coupon.find(filter)
    .populate("applicableSpecialtyId", "name displayName status")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countCoupons = (filter) => {
  return Coupon.countDocuments(filter);
};

export const updateCouponById = ({ couponId, payload }) => {
  return Coupon.findOneAndUpdate(
    {
      _id: couponId,
      isDeleted: false,
    },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const softDeleteCouponById = (couponId) => {
  return Coupon.findOneAndUpdate(
    {
      _id: couponId,
      isDeleted: false,
    },
    {
      isDeleted: true,
      isActive: false,
    },
    {
      new: true,
    }
  );
};

export const findDoctorCouponContext = (doctorId) => {
  return Doctor.findById(doctorId)
    .select("_id specialization professionalInfo accountStatus")
    .lean();
};

export const findActiveSpecialtyById = (specialtyId) => {
  return Specialty.findOne({
    _id: specialtyId,
    status: "active",
  }).lean();
};

export const countCouponUsageByUser = ({
  userId,
  couponId,
  session = null,
}) => {
  return CouponUsage.countDocuments({
    userId,
    couponId,
    status: "completed",
  }).session(session);
};

export const findAvailableCouponsForSpecialty = ({
  specialtyId,
  amount,
  now = new Date(),
}) => {
  return Coupon.find({
    isDeleted: false,
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
    minAmount: { $lte: amount },
    $or: [{ applicableSpecialtyId: null }, { applicableSpecialtyId: specialtyId }],
    $expr: {
      $or: [
        { $eq: ["$maxUsage", 0] },
        { $lt: ["$usedCount", "$maxUsage"] },
      ],
    },
  })
    .populate("applicableSpecialtyId", "name displayName")
    .sort({
      autoApply: -1,
      createdAt: -1,
    })
    .lean();
};