import Banner from "../../models/Banner.js";
import Coupon from "../../models/Coupon.js";
import Specialty from "../../models/Specialty.js";

const adminBannerPopulate = [
  {
    path: "specialtyId",
    select: "name displayName status",
  },
  {
    path: "couponId",
    select:
      "code title discountType discountValue maxDiscount minAmount isActive isDeleted validFrom validTo applicableSpecialtyId maxUsage usedCount",
  },
];

export const createBanner = (payload) => {
  return Banner.create(payload);
};

export const findBannerById = (bannerId) => {
  return Banner.findOne({
    _id: bannerId,
    isDeleted: false,
  })
    .populate(adminBannerPopulate)
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
    .populate(adminBannerPopulate)
    .sort({
      priority: 1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const findAdminBannersForComputedStatus = ({ filter }) => {
  return Banner.find(filter)
    .populate(adminBannerPopulate)
    .sort({
      priority: 1,
      createdAt: -1,
    })
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
  ).populate(adminBannerPopulate);
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
    $and: [
      {
        $or: [
          { startDate: null },
          { startDate: { $exists: false } },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: null },
          { endDate: { $exists: false } },
          { endDate: { $gte: now } },
        ],
      },
    ],
  })
    .populate({
      path: "specialtyId",
      match: {
        status: "active",
      },
      select: "name displayName status",
    })
    .populate({
      path: "couponId",
      match: {
        isDeleted: false,
        isActive: true,
        validFrom: {
          $lte: now,
        },
        validTo: {
          $gte: now,
        },
        $expr: {
          $or: [
            {
              $eq: ["$maxUsage", 0],
            },
            {
              $lt: ["$usedCount", "$maxUsage"],
            },
          ],
        },
      },
      select:
        "code title discountType discountValue maxDiscount minAmount isActive isDeleted validFrom validTo applicableSpecialtyId maxUsage usedCount",
    })
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