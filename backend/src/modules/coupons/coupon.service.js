import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

import {
  countCouponUsageByUser,
  countCoupons,
  createCoupon,
  findActiveSpecialtyById,
  findAvailableCouponsForSpecialty,
  findCouponByCode,
  findCouponById,
  findCoupons,
  findDoctorCouponContext,
  softDeleteCouponById,
  updateCouponById,
} from "./coupon.repository.js";

import {
  validateCouponCodeInput,
  validateCreateCouponInput,
  validateObjectId,
  validateUpdateCouponInput,
} from "./coupon.validator.js";

const normalizeCouponCode = (code) => {
  return code.trim().toUpperCase();
};

export const calculateCouponDiscount = ({ coupon, amount }) => {
  const numericAmount = Number(amount);

  let discount = 0;

  if (coupon.discountType === "flat") {
    discount = Number(coupon.discountValue);
  }

  if (coupon.discountType === "percentage") {
    discount = (numericAmount * Number(coupon.discountValue)) / 100;

    if (coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  }

  discount = Math.min(discount, numericAmount);

  return Math.floor(discount);
};

export const validateCouponForAppointment = async ({
  userId,
  doctorId,
  couponCode,
  appointmentAmount,
  session = null,
}) => {
  const code = normalizeCouponCode(couponCode);

  const coupon = await findCouponByCode({
    code,
    session,
  });

  if (!coupon) {
    throw new AppError("Invalid coupon code", 404);
  }

  if (!coupon.isActive || coupon.isDeleted) {
    throw new AppError("Coupon is not active", 400);
  }

  const now = new Date();

  if (now < coupon.validFrom) {
    throw new AppError("Coupon is not valid yet", 400);
  }

  if (now > coupon.validTo) {
    throw new AppError("Coupon has expired", 400);
  }

  const amount = Number(appointmentAmount);

  if (amount < coupon.minAmount) {
    throw new AppError(
      `Minimum appointment amount ₹${coupon.minAmount} required for this coupon`,
      400
    );
  }

  if (coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  const doctor = await findDoctorCouponContext(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (doctor.accountStatus?.isDeleted || doctor.accountStatus?.isBlocked) {
    throw new AppError("Doctor is currently unavailable", 400);
  }

  const doctorSpecialtyId =
    doctor.specialization?.specialtyId?.toString();

  if (
    coupon.applicableSpecialtyId &&
    coupon.applicableSpecialtyId.toString() !== doctorSpecialtyId
  ) {
    throw new AppError("Coupon is not applicable for this specialty", 400);
  }

  const usageCount = await countCouponUsageByUser({
    userId,
    couponId: coupon._id,
    session,
  });

  if (usageCount >= coupon.maxUsagePerUser) {
    throw new AppError("You have already used this coupon", 400);
  }

  const discount = calculateCouponDiscount({
    coupon,
    amount,
  });

  return {
    coupon,
    discount,
  };
};

export const createCouponService = async ({ adminId, body }) => {
  validateCreateCouponInput(body);

  const code = normalizeCouponCode(body.code);

  const existingCoupon = await findCouponByCode({
    code,
    includeDeleted: true,
  });

  if (existingCoupon && !existingCoupon.isDeleted) {
    throw new AppError("Coupon code already exists", 409);
  }

  if (body.applicableSpecialtyId) {
    const specialty = await findActiveSpecialtyById(body.applicableSpecialtyId);

    if (!specialty) {
      throw new AppError("Specialty not found or inactive", 404);
    }
  }

  const payload = {
    code,
    title: body.title.trim(),
    description: body.description?.trim() || "",
    discountType: body.discountType,
    discountValue: Number(body.discountValue),
    maxDiscount: Number(body.maxDiscount || 0),
    minAmount: Number(body.minAmount || 0),
    applicableSpecialtyId: body.applicableSpecialtyId || null,
    validFrom: new Date(body.validFrom),
    validTo: new Date(body.validTo),
    maxUsage: Number(body.maxUsage || 0),
    maxUsagePerUser: Number(body.maxUsagePerUser || 1),
    autoApply: Boolean(body.autoApply),
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    createdBy: adminId ? new mongoose.Types.ObjectId(adminId) : null,
  };

  return createCoupon(payload);
};

export const getAdminCouponsService = async ({ query }) => {
  const {
    page = 1,
    limit = 10,
    search = "",
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
      { code: regex },
      { title: regex },
      { description: regex },
    ];
  }

  if (status === "active") {
    filter.isActive = true;
  }

  if (status === "inactive") {
    filter.isActive = false;
  }

  const skip = (numericPage - 1) * numericLimit;

  const [coupons, totalCoupons] = await Promise.all([
    findCoupons({
      filter,
      skip,
      limit: numericLimit,
    }),
    countCoupons(filter),
  ]);

  return {
    coupons,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      totalCoupons,
      totalPages: Math.ceil(totalCoupons / numericLimit),
    },
  };
};

export const getAdminCouponDetailsService = async ({ couponId }) => {
  validateObjectId(couponId, "coupon id");

  const coupon = await findCouponById({
    couponId,
  });

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  return coupon;
};

export const updateCouponService = async ({ couponId, body }) => {
  validateObjectId(couponId, "coupon id");
  validateUpdateCouponInput(body);

  const existingCoupon = await findCouponById({
    couponId,
  });

  if (!existingCoupon) {
    throw new AppError("Coupon not found", 404);
  }
  const finalDiscountType =
  body.discountType !== undefined
    ? body.discountType
    : existingCoupon.discountType;

const finalDiscountValue =
  body.discountValue !== undefined
    ? Number(body.discountValue)
    : existingCoupon.discountValue;

if (finalDiscountType === "percentage" && finalDiscountValue > 100) {
  throw new AppError("Percentage discount cannot exceed 100", 400);
}

const finalValidFrom =
  body.validFrom !== undefined
    ? new Date(body.validFrom)
    : existingCoupon.validFrom;

const finalValidTo =
  body.validTo !== undefined
    ? new Date(body.validTo)
    : existingCoupon.validTo;

if (finalValidFrom >= finalValidTo) {
  throw new AppError("Valid to date must be after valid from date", 400);
}

if (
  body.maxUsage !== undefined &&
  Number(body.maxUsage) > 0 &&
  Number(body.maxUsage) < existingCoupon.usedCount
) {
  throw new AppError(
    "Max usage cannot be less than already used count",
    400
  );
}
  if (body.code) {
    const code = normalizeCouponCode(body.code);

    const duplicate = await findCouponByCode({
      code,
      includeDeleted: false,
    });

    if (
      duplicate &&
      duplicate._id.toString() !== existingCoupon._id.toString()
    ) {
      throw new AppError("Coupon code already exists", 409);
    }
  }

  if (body.applicableSpecialtyId) {
    const specialty = await findActiveSpecialtyById(body.applicableSpecialtyId);

    if (!specialty) {
      throw new AppError("Specialty not found or inactive", 404);
    }
  }

  const payload = {};

  const allowedFields = [
    "title",
    "description",
    "discountType",
    "discountValue",
    "maxDiscount",
    "minAmount",
    "applicableSpecialtyId",
    "validFrom",
    "validTo",
    "maxUsage",
    "maxUsagePerUser",
    "autoApply",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  if (body.code) {
    payload.code = normalizeCouponCode(body.code);
  }

  if (payload.validFrom) {
    payload.validFrom = new Date(payload.validFrom);
  }

  if (payload.validTo) {
    payload.validTo = new Date(payload.validTo);
  }

  return updateCouponById({
    couponId,
    payload,
  });
};

export const updateCouponStatusService = async ({ couponId, body }) => {
  validateObjectId(couponId, "coupon id");

  if (typeof body.isActive !== "boolean") {
    throw new AppError("isActive boolean value is required", 400);
  }

  const coupon = await updateCouponById({
    couponId,
    payload: {
      isActive: body.isActive,
    },
  });

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  return coupon;
};

export const deleteCouponService = async ({ couponId }) => {
  validateObjectId(couponId, "coupon id");

  const coupon = await softDeleteCouponById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  return coupon;
};

export const getAvailableCouponsService = async ({ userId, query }) => {
  if (!query.doctorId) {
    throw new AppError("Doctor id is required", 400);
  }

  validateObjectId(query.doctorId, "doctor id");

  const amount = Number(query.appointmentAmount || 0);

  if (amount < 0) {
    throw new AppError("Invalid appointment amount", 400);
  }

  const doctor = await findDoctorCouponContext(query.doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const specialtyId = doctor.specialization?.specialtyId;

  const coupons = await findAvailableCouponsForSpecialty({
    specialtyId,
    amount,
  });

  const couponsWithDiscount = await Promise.all(
    coupons.map(async (coupon) => {
      const usageCount = await countCouponUsageByUser({
        userId,
        couponId: coupon._id,
      });

      const isUserEligible = usageCount < coupon.maxUsagePerUser;

      return {
        ...coupon,
        discountPreview: isUserEligible
          ? calculateCouponDiscount({
              coupon,
              amount,
            })
          : 0,
        isUserEligible,
        ineligibleReason: isUserEligible
          ? ""
          : "You have already used this coupon",
      };
    })
  );

  return couponsWithDiscount;
};

export const validateCouponService = async ({ userId, body }) => {
  validateCouponCodeInput(body);

  const { coupon, discount } = await validateCouponForAppointment({
    userId,
    doctorId: body.doctorId,
    couponCode: body.couponCode,
    appointmentAmount: body.appointmentAmount,
  });

  return {
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      minAmount: coupon.minAmount,
      applicableSpecialtyId: coupon.applicableSpecialtyId,
    },
    discount,
    finalAmount: Math.max(Number(body.appointmentAmount) - discount, 0),
  };
};