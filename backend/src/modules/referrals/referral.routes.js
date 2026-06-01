import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";

import {
  getAdminReferralsController,
  getMyReferralController,
  getMyReferralHistoryController,
  getReferralConfigController,
  updateReferralConfigController,
} from "./referral.controller.js";

const router = express.Router();

// ==============================
// PATIENT ROUTES
// ==============================
router.get("/me", protect, getMyReferralController);
router.get("/history", protect, getMyReferralHistoryController);

// ==============================
// ADMIN ROUTES
// ==============================
router.get("/admin", protectAdmin, getAdminReferralsController);
router.get("/admin/config", protectAdmin, getReferralConfigController);
router.put("/admin/config", protectAdmin, updateReferralConfigController);

export default router;