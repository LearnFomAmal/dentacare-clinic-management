import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import AppError from "../../shared/errors/AppError.js";

import {
  countAdminBanners,
  createBanner,
  findActiveBannersByLocation,
  findActiveCouponById,
  findActiveSpecialtyById,
  findAdminBanners,
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

const buildRedirectUrl = ({ type, redirectUrl, specialtyId, couponCode }) => {
  if (redirectUrl && redirectUrl.trim()) {
    return redirectUrl.trim();
  }

  if (type === "referral") {
    return "/referral";
  }

  if (type === "specialty_coupon") {
    return `/doctors?specialty=${specialtyId}&coupon=${couponCode}`;
  }

  return "/";
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
      redirectUrl: body.redirectUrl,
      specialtyId: body.specialtyId,
      couponCode,
    }),
    specialtyId,
    couponId,
    couponCode,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
    priority: Number(body.priority || 1),
    isActive: normalizeBoolean(body.isActive, true),
    createdBy: adminId ? new mongoose.Types.ObjectId(adminId) : null,
  };

  return createBanner(payload);
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

  if (status === "active") {
    filter.isActive = true;
  }

  if (status === "inactive") {
    filter.isActive = false;
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
    banners,
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

  return banner;
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
    payload.startDate = new Date(body.startDate);
  }

  if (body.endDate !== undefined) {
    payload.endDate = new Date(body.endDate);
  }

  if (body.isActive !== undefined) {
    payload.isActive = normalizeBoolean(body.isActive, existingBanner.isActive);
  }

  payload.specialtyId = specialtyId;
  payload.couponId = couponId;
  payload.couponCode = couponCode;

  payload.redirectUrl = buildRedirectUrl({
    type: finalType,
    redirectUrl: body.redirectUrl,
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

  return updateBannerById({
    bannerId,
    payload,
  });
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

  return banner;
};

export const deleteBannerService = async ({ bannerId }) => {
  validateObjectId(bannerId, "banner id");

  const existingBanner = await findBannerDocumentById(bannerId);

  if (!existingBanner) {
    throw new AppError("Banner not found", 404);
  }

  const banner = await softDeleteBannerById(bannerId);

  return banner;
};

export const getPublicBannersByLocationService = async ({ location }) => {
  if (!["home", "doctors"].includes(location)) {
    throw new AppError("Invalid banner location", 400);
  }

  const banners = await findActiveBannersByLocation({
    location,
  });

  return banners.map((banner) => ({
    _id: banner._id,
    title: banner.title,
    description: banner.description,
    imageUrl: banner.imageUrl,
    type: banner.type,
    locations: banner.locations,
    ctaText: banner.ctaText,
    redirectUrl: banner.redirectUrl,
    specialty: banner.specialtyId || null,
    coupon: banner.couponId || null,
    couponCode: banner.couponCode,
    priority: banner.priority,
  }));
};