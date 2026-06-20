import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import AppError from "../../shared/errors/AppError.js";
import { env } from "../../config/env.js";
import {
  countAdminBanners,
  createBanner,
  findActiveBannersByLocation,
  findActiveCouponById,
  findActiveSpecialtyById,
 findAdminBanners,
findAdminBannersForComputedStatus,
findBannerById,
findBannerDocumentById,
  softDeleteBannerById,
  updateBannerById,
} from "./banner.repository.js";

import {
  normalizeBoolean,
  normalizeLocations,
  validateCreateBannerInput,
  validateObjectId,
  validateUpdateBannerInput,
  validateUpdateBannerStatusInput,
} from "./banner.validator.js";
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});
const uploadBufferToCloudinary = ({ fileBuffer, folder }) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log("Failed to delete banner image:", error.message);
  }
};

const buildRedirectUrl = ({ type, specialtyId, couponCode }) => {
  if (type === "referral") {
    return "/referrals";
  }

  if (type === "specialty_coupon") {
    const params = new URLSearchParams();

    if (specialtyId) {
      params.set("specialty", specialtyId.toString());
    }

    if (couponCode) {
      params.set("coupon", couponCode);
    }

    return `/doctors?${params.toString()}`;
  }

  return "/doctors";
};

const getPlainBanner = (banner) => {
  return banner?.toObject ? banner.toObject() : banner;
};

const getBannerComputedStatus = (banner) => {
  const plainBanner = getPlainBanner(banner);
  const now = new Date();

  if (!plainBanner.isActive) {
    return {
      computedStatus: "inactive",
      computedStatusLabel: "Inactive",
      isCurrentlyVisible: false,
    };
  }

  if (plainBanner.startDate && new Date(plainBanner.startDate) > now) {
    return {
      computedStatus: "upcoming",
      computedStatusLabel: "Upcoming",
      isCurrentlyVisible: false,
    };
  }

  if (plainBanner.endDate && new Date(plainBanner.endDate) < now) {
    return {
      computedStatus: "expired",
      computedStatusLabel: "Expired",
      isCurrentlyVisible: false,
    };
  }

  if (plainBanner.type === "specialty_coupon") {
    const specialty = plainBanner.specialtyId || null;
    const coupon = plainBanner.couponId || null;

    if (!specialty || !coupon) {
      return {
        computedStatus: "offer_unavailable",
        computedStatusLabel: "Offer Unavailable",
        isCurrentlyVisible: false,
      };
    }

    if (specialty.status && specialty.status !== "active") {
      return {
        computedStatus: "specialty_inactive",
        computedStatusLabel: "Specialty Inactive",
        isCurrentlyVisible: false,
      };
    }

    if (coupon.isDeleted || !coupon.isActive) {
      return {
        computedStatus: "coupon_inactive",
        computedStatusLabel: "Coupon Inactive",
        isCurrentlyVisible: false,
      };
    }

    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return {
        computedStatus: "coupon_upcoming",
        computedStatusLabel: "Coupon Upcoming",
        isCurrentlyVisible: false,
      };
    }

    if (coupon.validTo && new Date(coupon.validTo) < now) {
      return {
        computedStatus: "coupon_expired",
        computedStatusLabel: "Coupon Expired",
        isCurrentlyVisible: false,
      };
    }

    if (
      Number(coupon.maxUsage || 0) > 0 &&
      Number(coupon.usedCount || 0) >= Number(coupon.maxUsage || 0)
    ) {
      return {
        computedStatus: "coupon_usage_finished",
        computedStatusLabel: "Coupon Usage Finished",
        isCurrentlyVisible: false,
      };
    }
  }

  return {
    computedStatus: "active",
    computedStatusLabel: "Active",
    isCurrentlyVisible: true,
  };
};

const attachBannerComputedStatus = (banner) => {
  if (!banner) return banner;

  const plainBanner = getPlainBanner(banner);

  return {
    ...plainBanner,
    ...getBannerComputedStatus(plainBanner),
  };
};

const attachBannersComputedStatus = (banners = []) => {
  return banners.map(attachBannerComputedStatus);
};

const matchesComputedBannerStatus = (banner, status) => {
  if (!status) return true;

  const bannerStatus = banner.computedStatus;

  if (status === "active") {
    return bannerStatus === "active";
  }

  if (status === "inactive") {
    return [
      "inactive",
      "coupon_inactive",
      "specialty_inactive",
      "offer_unavailable",
    ].includes(bannerStatus);
  }

  if (status === "upcoming") {
    return ["upcoming", "coupon_upcoming"].includes(bannerStatus);
  }

  if (status === "expired") {
    return ["expired", "coupon_expired"].includes(bannerStatus);
  }

  if (status === "usage_finished") {
    return bannerStatus === "coupon_usage_finished";
  }

  return bannerStatus === status;
};
const validateSpecialtyCouponBannerRelation = async ({
  specialtyId,
  couponId,
  couponCode,
}) => {
  const specialty = await findActiveSpecialtyById(specialtyId);

  if (!specialty) {
    throw new AppError("Specialty not found or inactive", 404);
  }

  const coupon = await findActiveCouponById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found or inactive", 404);
  }

  if (coupon.code !== couponCode.trim().toUpperCase()) {
    throw new AppError("Coupon code does not match selected coupon", 400);
  }

  if (
    coupon.applicableSpecialtyId &&
    coupon.applicableSpecialtyId.toString() !== specialtyId.toString()
  ) {
    throw new AppError(
      "Selected coupon is not applicable for selected specialty",
      400
    );
  }

  const now = new Date();

  if (now > coupon.validTo) {
    throw new AppError("Selected coupon has expired", 400);
  }
  if (now < coupon.validFrom) {
  throw new AppError("Selected coupon is not valid yet", 400);
}

if (
  Number(coupon.maxUsage || 0) > 0 &&
  Number(coupon.usedCount || 0) >= Number(coupon.maxUsage || 0)
) {
  throw new AppError("Selected coupon usage limit is already finished", 400);
}
  return {
    specialty,
    coupon,
  };
};

export const createBannerService = async ({ adminId, body, file }) => {
  const { locations } = validateCreateBannerInput({
    body,
    file,
  });

  let specialtyId = null;
  let couponId = null;
  let couponCode = "";

  if (body.type === "specialty_coupon") {
    await validateSpecialtyCouponBannerRelation({
      specialtyId: body.specialtyId,
      couponId: body.couponId,
      couponCode: body.couponCode,
    });

    specialtyId = new mongoose.Types.ObjectId(body.specialtyId);
    couponId = new mongoose.Types.ObjectId(body.couponId);
    couponCode = body.couponCode.trim().toUpperCase();
  }

  const uploadedImage = await uploadBufferToCloudinary({
    fileBuffer: file.buffer,
    folder: "dentacare/banners",
  });

  const payload = {
    title: body.title.trim(),
    description: body.description?.trim() || "",
    imageUrl: uploadedImage.secure_url,
    imagePublicId: uploadedImage.public_id,
    type: body.type,
    locations,
    ctaText: body.ctaText?.trim() || "View Offer",
  redirectUrl: buildRedirectUrl({
  type: body.type,
  specialtyId: body.specialtyId,
  couponCode,
}),
    specialtyId,
    couponId,
    couponCode,
        startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    priority: Number(body.priority || 1),
    isActive: normalizeBoolean(body.isActive, true),
    createdBy: adminId ? new mongoose.Types.ObjectId(adminId) : null,
  };

  const banner = await createBanner(payload);

const populatedBanner = await findBannerById(banner._id);

return attachBannerComputedStatus(populatedBanner);

};

export const getAdminBannersService = async ({ query }) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    type = "",
    location = "",
    status = "",
  } = query;

  const numericPage = Math.max(Number(page), 1);
  const numericLimit = Math.min(Math.max(Number(limit), 1), 50);

  const filter = {
    isDeleted: false,
  };

  if (search.trim()) {
    const regex = new RegExp(search.trim(), "i");

    filter.$or = [
      {
        title: regex,
      },
      {
        description: regex,
      },
      {
        couponCode: regex,
      },
    ];
  }

  if (["referral", "specialty_coupon"].includes(type)) {
    filter.type = type;
  }

  if (["home", "doctors"].includes(location)) {
    filter.locations = location;
  }

  if (status) {
    const allBanners = await findAdminBannersForComputedStatus({
      filter,
    });

    const bannersWithStatus = attachBannersComputedStatus(allBanners);

    const filteredBanners = bannersWithStatus.filter((banner) =>
      matchesComputedBannerStatus(banner, status)
    );

    const skip = (numericPage - 1) * numericLimit;
    const paginatedBanners = filteredBanners.slice(
      skip,
      skip + numericLimit
    );

    return {
      banners: paginatedBanners,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        totalBanners: filteredBanners.length,
        totalPages: Math.ceil(filteredBanners.length / numericLimit),
      },
    };
  }

  const skip = (numericPage - 1) * numericLimit;

  const [banners, totalBanners] = await Promise.all([
    findAdminBanners({
      filter,
      skip,
      limit: numericLimit,
    }),
    countAdminBanners(filter),
  ]);

  return {
    banners: attachBannersComputedStatus(banners),
    pagination: {
      page: numericPage,
      limit: numericLimit,
      totalBanners,
      totalPages: Math.ceil(totalBanners / numericLimit),
    },
  };
};

export const getAdminBannerDetailsService = async ({ bannerId }) => {
  validateObjectId(bannerId, "banner id");

  const banner = await findBannerById(bannerId);

  if (!banner) {
    throw new AppError("Banner not found", 404);
  }

  return attachBannerComputedStatus(banner);
};

export const updateBannerService = async ({ bannerId, body, file }) => {
  validateUpdateBannerInput({
    bannerId,
    body,
  });

  const existingBanner = await findBannerDocumentById(bannerId);
    
  if (!existingBanner) {
    throw new AppError("Banner not found", 404);
  }
    const finalStartDate =
  body.startDate !== undefined
    ? body.startDate
      ? new Date(body.startDate)
      : null
    : existingBanner.startDate;

const finalEndDate =
  body.endDate !== undefined
    ? body.endDate
      ? new Date(body.endDate)
      : null
    : existingBanner.endDate;

if ((finalStartDate && !finalEndDate) || (!finalStartDate && finalEndDate)) {
  throw new AppError(
    "Both start date and end date are required for scheduled banners",
    400
  );
}

if (finalStartDate && finalEndDate && finalStartDate >= finalEndDate) {
  throw new AppError("End date must be after start date", 400);
}
  const finalType = body.type || existingBanner.type;

  const finalLocations =
    body.locations !== undefined
      ? normalizeLocations(body.locations)
      : existingBanner.locations;

  if (finalType === "referral" && finalLocations.includes("doctors")) {
    throw new AppError(
      "Referral banner can be shown only on home page",
      400
    );
  }

  const finalSpecialtyId =
    body.specialtyId !== undefined
      ? body.specialtyId
      : existingBanner.specialtyId;

  const finalCouponId =
    body.couponId !== undefined
      ? body.couponId
      : existingBanner.couponId;

  const finalCouponCode =
    body.couponCode !== undefined
      ? body.couponCode.trim().toUpperCase()
      : existingBanner.couponCode;

  let specialtyId = null;
  let couponId = null;
  let couponCode = "";

  if (finalType === "specialty_coupon") {
    if (!finalSpecialtyId) {
      throw new AppError("Specialty is required for specialty coupon banner", 400);
    }

    if (!finalCouponId) {
      throw new AppError("Coupon is required for specialty coupon banner", 400);
    }

    if (!finalCouponCode) {
      throw new AppError("Coupon code is required for specialty coupon banner", 400);
    }

    await validateSpecialtyCouponBannerRelation({
      specialtyId: finalSpecialtyId,
      couponId: finalCouponId,
      couponCode: finalCouponCode,
    });

    specialtyId = new mongoose.Types.ObjectId(finalSpecialtyId);
    couponId = new mongoose.Types.ObjectId(finalCouponId);
    couponCode = finalCouponCode;
  }

  const payload = {};

  const allowedFields = [
    "title",
    "description",
    "type",
    "ctaText",
    "priority",
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] =
        typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  });

  if (body.locations !== undefined) {
    payload.locations = finalLocations;
  }

  if (body.startDate !== undefined) {
    payload.startDate = body.startDate ? new Date(body.startDate) : null;
  }

  if (body.endDate !== undefined) {
    payload.endDate = body.endDate ? new Date(body.endDate) : null;
  }

  if (body.isActive !== undefined) {
    payload.isActive = normalizeBoolean(body.isActive, existingBanner.isActive);
  }

  payload.specialtyId = specialtyId;
  payload.couponId = couponId;
  payload.couponCode = couponCode;

 payload.redirectUrl = buildRedirectUrl({
  type: finalType,
  specialtyId: finalSpecialtyId,
  couponCode,
});

  if (file) {
    const uploadedImage = await uploadBufferToCloudinary({
      fileBuffer: file.buffer,
      folder: "dentacare/banners",
    });

    payload.imageUrl = uploadedImage.secure_url;
    payload.imagePublicId = uploadedImage.public_id;

    await deleteCloudinaryImage(existingBanner.imagePublicId);
  }

  const banner = await updateBannerById({
  bannerId,
  payload,
});

return attachBannerComputedStatus(banner);

};

export const updateBannerStatusService = async ({ bannerId, body }) => {
  validateUpdateBannerStatusInput({
    bannerId,
    body,
  });

  const banner = await updateBannerById({
    bannerId,
    payload: {
      isActive: body.isActive,
    },
  });

  if (!banner) {
    throw new AppError("Banner not found", 404);
  }

  return attachBannerComputedStatus(banner);
};

export const deleteBannerService = async ({ bannerId }) => {
  validateObjectId(bannerId, "banner id");

  const existingBanner = await findBannerDocumentById(bannerId);

  if (!existingBanner) {
    throw new AppError("Banner not found", 404);
  }

  const banner = await softDeleteBannerById(bannerId);

  await deleteCloudinaryImage(existingBanner.imagePublicId);

  return attachBannerComputedStatus(banner);
};

export const getPublicBannersByLocationService = async ({ location }) => {
  if (!["home", "doctors"].includes(location)) {
    throw new AppError("Invalid banner location", 400);
  }

  const banners = await findActiveBannersByLocation({
    location,
  });

  const now = new Date();

const visibleBanners = banners.filter((banner) => {
    if (banner.type === "referral") {
      return true;
    }

    if (banner.type === "specialty_coupon") {
     const specialty = banner.specialtyId || null;
const coupon = banner.couponId || null;

if (!specialty || !coupon) {
  return false;
}

if (specialty.status !== "active") {
  return false;
}

if (coupon.isDeleted || !coupon.isActive) {
  return false;
}

if (coupon.validFrom && new Date(coupon.validFrom) > now) {
  return false;
}

if (coupon.validTo && new Date(coupon.validTo) < now) {
  return false;
}

if (
  Number(coupon.maxUsage || 0) > 0 &&
  Number(coupon.usedCount || 0) >= Number(coupon.maxUsage || 0)
) {
  return false;
}

const couponSpecialtyId =
  coupon.applicableSpecialtyId?.toString?.() || "";

const bannerSpecialtyId = specialty._id?.toString?.() || "";

if (couponSpecialtyId && couponSpecialtyId !== bannerSpecialtyId) {
  return false;
}

return true;
    }

    return false;
  });

  return visibleBanners.map((banner) => {
    const coupon = banner.couponId || null;
    const specialty = banner.specialtyId || null;

    return {
      _id: banner._id,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      type: banner.type,
      locations: banner.locations,
      ctaText: banner.ctaText,

      redirectUrl: buildRedirectUrl({
        type: banner.type,
        specialtyId: specialty?._id || banner.specialtyId,
        couponCode: banner.couponCode,
      }),

      specialty,
      specialtyId: specialty?._id || null,

      coupon,
      couponId: coupon?._id || null,
      couponCode: banner.couponCode || coupon?.code || "",

      couponValidFrom: coupon?.validFrom || null,
      couponValidTo: coupon?.validTo || null,

      startDate: banner.startDate || null,
      endDate: banner.endDate || null,

      priority: banner.priority,
    };
  });
};