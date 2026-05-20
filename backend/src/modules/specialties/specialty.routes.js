import express from "express";

import {
  createSpecialtyController,
  getAllSpecialtiesController,
  updateSpecialtyController,
  updateSpecialtyStatusController,
  getAllActiveSpecialtiesController,
  deleteSpecialtyController,
} from "./specialty.controller.js";

import {
  protectAdmin,
} from "../../middlewares/adminAuth.middleware.js";

const router = express.Router();


// CREATE SPECIALTY
router.post(
  "/",
  protectAdmin,
  createSpecialtyController
);


// GET ALL SPECIALTIES
router.get(
  "/",
  protectAdmin,
  getAllSpecialtiesController
);

router.get(
  "/public",
  getAllActiveSpecialtiesController
);
// UPDATE SPECIALTY
router.patch(
  "/:id",
  protectAdmin,
  updateSpecialtyController
);


// UPDATE SPECIALTY STATUS
router.patch(
  "/:id/status",
  protectAdmin,
  updateSpecialtyStatusController
);

router.delete(
  "/:id",
  protectAdmin,
  deleteSpecialtyController
);

export default router;