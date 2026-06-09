import Banner from "../../models/Banner.js";
import Coupon from "../../models/Coupon.js";
import Specialty from "../../models/Specialty.js";

export const createBanner = (payload) => {
  return Banner.create(payload);
};

export const findBannerById = (bannerId) => {
  return Banner.findOne({
    _id: bannerId,
    isDeleted: false,
  })
    .populate("specialtyId", "name displayName status")
    .populate("couponId", "code title discountType discountValue isActive validFrom validTo applicableSpecialtyId")
    .lean();
};

export const findBannerDocumentById = (bannerId) => {
  return Banner.findOne({
    _id: bannerId,
    isDeleted: false,
  });
};

export const findAdminBanners = ({ filter, skip, limit }) => {
  return Banner.find(filter)
    .populate("specialtyId", "name displayName status")
    .populate("couponId", "code title discountType discountValue isActive validFrom validTo")
    .sort({
      priority: 1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAdminBanners = (filter) => {
  return Banner.countDocuments(filter);
};

export const updateBannerById = ({ bannerId, payload }) => {
  return Banner.findOneAndUpdate(
    {
      _id: bannerId,
      isDeleted: false,
    },
    payload,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("specialtyId", "name displayName status")
    .populate("couponId", "code title discountType discountValue isActive validFrom validTo");
};

export const softDeleteBannerById = (bannerId) => {
  return Banner.findOneAndUpdate(
    {
      _id: bannerId,
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

export const findActiveBannersByLocation = ({ location, now = new Date() }) => {
  return Banner.find({
    isDeleted: false,
    isActive: true,
    locations: location,
    startDate: {
      $lte: now,
    },
    endDate: {
      $gte: now,
    },
  })
    .populate("specialtyId", "name displayName status")
    .populate("couponId", "code title discountType discountValue isActive validFrom validTo applicableSpecialtyId")
    .sort({
      priority: 1,
      createdAt: -1,
    })
    .lean();
};

export const findActiveSpecialtyById = (specialtyId) => {
  return Specialty.findOne({
    _id: specialtyId,
    status: "active",
  }).lean();
};

export const findActiveCouponById = (couponId) => {
  return Coupon.findOne({
    _id: couponId,
    isDeleted: false,
    isActive: true,
  }).lean();
};