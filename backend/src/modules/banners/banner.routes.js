import express from "express";

import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";
import { uploadBannerImage } from "../../middlewares/upload.middleware.js";

import {
  createBannerController,
  deleteBannerController,
  getAdminBannerDetailsController,
  getAdminBannersController,
  getDoctorPageBannersController,
  getHomeBannersController,
  updateBannerController,
  updateBannerStatusController,
} from "./banner.controller.js";

const router = express.Router();

// ==============================
// PUBLIC / PATIENT DISPLAY ROUTES
// ==============================
router.get("/home", getHomeBannersController);

router.get("/doctors", getDoctorPageBannersController);

// ==============================
// ADMIN ROUTES
// ==============================
router.post(
  "/admin",
  protectAdmin,
  uploadBannerImage,
  createBannerController
);

router.get(
  "/admin",
  protectAdmin,
  getAdminBannersController
);

router.get(
  "/admin/:bannerId",
  protectAdmin,
  getAdminBannerDetailsController
);

router.patch(
  "/admin/:bannerId",
  protectAdmin,
  uploadBannerImage,
  updateBannerController
);

router.patch(
  "/admin/:bannerId/status",
  protectAdmin,
  updateBannerStatusController
);

router.delete(
  "/admin/:bannerId",
  protectAdmin,
  deleteBannerController
);

export default router;