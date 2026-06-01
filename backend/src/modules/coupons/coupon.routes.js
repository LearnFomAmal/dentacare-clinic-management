import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";

import {
  createCouponController,
  deleteCouponController,
  getAdminCouponDetailsController,
  getAdminCouponsController,
  getAvailableCouponsController,
  updateCouponController,
  updateCouponStatusController,
  validateCouponController,
} from "./coupon.controller.js";

const router = express.Router();

// ==============================
// PATIENT ROUTES
// ==============================
router.get("/available", protect, getAvailableCouponsController);

router.post("/validate", protect, validateCouponController);

// ==============================
// ADMIN ROUTES
// ==============================
router.post("/admin", protectAdmin, createCouponController);

router.get("/admin", protectAdmin, getAdminCouponsController);

router.get(
  "/admin/:couponId",
  protectAdmin,
  getAdminCouponDetailsController
);

router.patch(
  "/admin/:couponId",
  protectAdmin,
  updateCouponController
);

router.patch(
  "/admin/:couponId/status",
  protectAdmin,
  updateCouponStatusController
);

router.delete(
  "/admin/:couponId",
  protectAdmin,
  deleteCouponController
);

export default router;