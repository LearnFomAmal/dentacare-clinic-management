import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const normalizeLocations = (locations) => {
  if (Array.isArray(locations)) {
    return locations;
  }

  if (typeof locations === "string") {
    try {
      const parsedLocations = JSON.parse(locations);

      if (Array.isArray(parsedLocations)) {
        return parsedLocations;
      }
    } catch (error) {
      return locations
        .split(",")
        .map((location) => location.trim())
        .filter(Boolean);
    }
  }

  return [];
};

export const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return defaultValue;
};

export const validateBannerType = (type) => {
  if (!["referral", "specialty_coupon"].includes(type)) {
    throw new AppError(
      "Banner type must be referral or specialty_coupon",
      400
    );
  }
};

export const validateBannerLocations = (locations) => {
  const allowedLocations = ["home", "doctors"];

  if (!Array.isArray(locations) || locations.length === 0) {
    throw new AppError("At least one banner location is required", 400);
  }

  const hasInvalidLocation = locations.some(
    (location) => !allowedLocations.includes(location)
  );

  if (hasInvalidLocation) {
    throw new AppError("Invalid banner location", 400);
  }
};

export const validateBannerDates = ({ startDate, endDate }) => {
  if (!startDate || !endDate) {
    throw new AppError("Start date and end date are required", 400);
  }

  const fromDate = new Date(startDate);
  const toDate = new Date(endDate);

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime())
  ) {
    throw new AppError("Invalid banner date", 400);
  }

  if (fromDate >= toDate) {
    throw new AppError("End date must be after start date", 400);
  }
};

export const validateCreateBannerInput = ({ body, file }) => {
  const {
    title,
    description,
    type,
    specialtyId,
    couponId,
    couponCode,
    startDate,
    endDate,
    priority,
  } = body;

  if (!title || !title.trim()) {
    throw new AppError("Banner title is required", 400);
  }

  if (title.trim().length > 120) {
    throw new AppError("Banner title cannot exceed 120 characters", 400);
  }

  if (description && description.length > 500) {
    throw new AppError("Banner description cannot exceed 500 characters", 400);
  }

  if (!file) {
    throw new AppError("Banner image is required", 400);
  }

  validateBannerType(type);

  const locations = normalizeLocations(body.locations);

  validateBannerLocations(locations);

  validateBannerDates({
    startDate,
    endDate,
  });

  if (priority !== undefined && Number(priority) < 1) {
    throw new AppError("Priority must be at least 1", 400);
  }

  if (type === "referral") {
    if (locations.includes("doctors")) {
      throw new AppError(
        "Referral banner can be shown only on home page",
        400
      );
    }
  }

  if (type === "specialty_coupon") {
    if (!specialtyId) {
      throw new AppError("Specialty is required for specialty coupon banner", 400);
    }

    if (!couponId) {
      throw new AppError("Coupon is required for specialty coupon banner", 400);
    }

    if (!couponCode || !couponCode.trim()) {
      throw new AppError("Coupon code is required for specialty coupon banner", 400);
    }

    validateObjectId(specialtyId, "specialty id");
    validateObjectId(couponId, "coupon id");
  }

  return {
    locations,
  };
};

export const validateUpdateBannerInput = ({ bannerId, body }) => {
  validateObjectId(bannerId, "banner id");

  if (!body || Object.keys(body).length === 0) {
    throw new AppError("No update data provided", 400);
  }

  if (body.title !== undefined) {
    if (!body.title.trim()) {
      throw new AppError("Banner title cannot be empty", 400);
    }

    if (body.title.trim().length > 120) {
      throw new AppError("Banner title cannot exceed 120 characters", 400);
    }
  }

  if (body.description !== undefined && body.description.length > 500) {
    throw new AppError("Banner description cannot exceed 500 characters", 400);
  }

  if (body.type !== undefined) {
    validateBannerType(body.type);
  }

  if (body.locations !== undefined) {
    const locations = normalizeLocations(body.locations);

    validateBannerLocations(locations);
  }

  if (body.startDate !== undefined || body.endDate !== undefined) {
    if (!body.startDate || !body.endDate) {
      throw new AppError(
        "Both start date and end date are required when updating dates",
        400
      );
    }

    validateBannerDates({
      startDate: body.startDate,
      endDate: body.endDate,
    });
  }

  if (body.priority !== undefined && Number(body.priority) < 1) {
    throw new AppError("Priority must be at least 1", 400);
  }

  if (body.specialtyId) {
    validateObjectId(body.specialtyId, "specialty id");
  }

  if (body.couponId) {
    validateObjectId(body.couponId, "coupon id");
  }
};

export const validateUpdateBannerStatusInput = ({ bannerId, body }) => {
  validateObjectId(bannerId, "banner id");

  if (typeof body.isActive !== "boolean") {
    throw new AppError("isActive boolean value is required", 400);
  }
};