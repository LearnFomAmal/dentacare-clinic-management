import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";

import {
  getMyProfileController,
  updateMyProfileController,
  changePasswordController,
  deleteMyAccountController,
  getMySessionsController,
  updateThemeController,
  getAllPatientsController,
  getPatientDetailsController,
  blockUserController,
  unblockUserController,
} from "./user.controller.js";

const router = express.Router();

// ==============================
// PATIENT SELF ROUTES
// ==============================
router.get("/me", protect, getMyProfileController);
router.patch("/me", protect, updateMyProfileController);
router.patch("/change-password", protect, changePasswordController);
router.delete("/me", protect, deleteMyAccountController);
router.get("/sessions", protect, getMySessionsController);
router.patch("/theme", protect, updateThemeController);

// ==============================
// ADMIN PATIENT MANAGEMENT ROUTES
// ==============================
router.get(
  "/patients",
  protectAdmin,
  getAllPatientsController
);

router.get(
  "/patients/:id",
  protectAdmin,
  getPatientDetailsController
);

router.patch(
  "/patients/:id/block",
  protectAdmin,
  blockUserController
);

router.patch(
  "/patients/:id/unblock",
  protectAdmin,
  unblockUserController
);

export default router;