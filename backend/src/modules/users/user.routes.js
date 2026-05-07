import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";

import {
  getMyProfileController,
  updateMyProfileController,
  changePasswordController,
  deleteMyAccountController,
  getMySessionsController,
  updateThemeController,
} from "./user.controller.js";

const router = express.Router();

router.get("/me", protect, getMyProfileController);
router.patch("/me", protect, updateMyProfileController);
router.patch("/change-password", protect, changePasswordController);
router.delete("/me", protect, deleteMyAccountController);
router.get("/sessions", protect, getMySessionsController);
router.patch("/theme", protect, updateThemeController);

export default router;