import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";
import { protectDoctor } from "../../middlewares/doctorAuth.middleware.js";

import {
  approveReviewByAdminController,
  createReviewController,
  deleteMyReviewController,
  getAdminReviewDetailsController,
  getAdminReviewsController,
  getDoctorOwnReviewsController,
  getDoctorReviewSummaryController,
  getMyReviewDetailsController,
  getMyReviewsController,
  getPublicDoctorReviewsController,
  rejectReviewByAdminController,
  updateMyReviewController,
} from "./review.controller.js";

const router = express.Router();

// ==============================
// PATIENT ROUTES
// ==============================
router.post("/", protect, createReviewController);

router.get("/my", protect, getMyReviewsController);

router.get("/my/:reviewId", protect, getMyReviewDetailsController);

router.patch("/:reviewId", protect, updateMyReviewController);

router.delete("/:reviewId", protect, deleteMyReviewController);

// ==============================
// DOCTOR ROUTES
// ==============================
router.get("/doctor/me", protectDoctor, getDoctorOwnReviewsController);

// ==============================
// PUBLIC DOCTOR REVIEW ROUTES
// ==============================
router.get(
  "/doctor/:doctorId/summary",
  getDoctorReviewSummaryController
);

router.get(
  "/doctor/:doctorId",
  getPublicDoctorReviewsController
);

// ==============================
// ADMIN ROUTES
// ==============================
router.get("/admin", protectAdmin, getAdminReviewsController);

router.get(
  "/admin/:reviewId",
  protectAdmin,
  getAdminReviewDetailsController
);

router.patch(
  "/admin/:reviewId/approve",
  protectAdmin,
  approveReviewByAdminController
);

router.patch(
  "/admin/:reviewId/reject",
  protectAdmin,
  rejectReviewByAdminController
);

export default router;