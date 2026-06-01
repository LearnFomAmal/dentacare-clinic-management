import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  createCouponService,
  deleteCouponService,
  getAdminCouponDetailsService,
  getAdminCouponsService,
  getAvailableCouponsService,
  updateCouponService,
  updateCouponStatusService,
  validateCouponService,
} from "./coupon.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

const getAdminId = (req) => {
  return req.admin?.adminId || req.admin?._id || req.admin?.id;
};

export const createCouponController = asyncHandler(async (req, res) => {
  const coupon = await createCouponService({
    adminId: getAdminId(req),
    body: req.body,
  });

  sendResponse(res, 201, true, "Coupon created successfully", coupon);
});

export const getAdminCouponsController = asyncHandler(async (req, res) => {
  const data = await getAdminCouponsService({
    query: req.query,
  });

  sendResponse(res, 200, true, "Coupons fetched successfully", data);
});

export const getAdminCouponDetailsController = asyncHandler(
  async (req, res) => {
    const coupon = await getAdminCouponDetailsService({
      couponId: req.params.couponId,
    });

    sendResponse(res, 200, true, "Coupon details fetched successfully", coupon);
  }
);

export const updateCouponController = asyncHandler(async (req, res) => {
  const coupon = await updateCouponService({
    couponId: req.params.couponId,
    body: req.body,
  });

  sendResponse(res, 200, true, "Coupon updated successfully", coupon);
});

export const updateCouponStatusController = asyncHandler(async (req, res) => {
  const coupon = await updateCouponStatusService({
    couponId: req.params.couponId,
    body: req.body,
  });

  sendResponse(res, 200, true, "Coupon status updated successfully", coupon);
});

export const deleteCouponController = asyncHandler(async (req, res) => {
  const coupon = await deleteCouponService({
    couponId: req.params.couponId,
  });

  sendResponse(res, 200, true, "Coupon deleted successfully", coupon);
});

export const getAvailableCouponsController = asyncHandler(async (req, res) => {
  const coupons = await getAvailableCouponsService({
    userId: getPatientId(req),
    query: req.query,
  });

  sendResponse(res, 200, true, "Available coupons fetched successfully", coupons);
});

export const validateCouponController = asyncHandler(async (req, res) => {
  const result = await validateCouponService({
    userId: getPatientId(req),
    body: req.body,
  });

  sendResponse(res, 200, true, "Coupon applied successfully", result);
});