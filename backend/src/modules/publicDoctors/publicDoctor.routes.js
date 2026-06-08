import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  getPublicDoctorAvailableSlotsController,
  getPublicDoctorDetailsController,
  getPublicDoctorsController,
} from "./publicDoctor.controller.js";

const router = express.Router();

router.get("/", getPublicDoctorsController);

router.get(
  "/:doctorId/available-slots",
  protect,
  getPublicDoctorAvailableSlotsController
);

router.get("/:doctorId", getPublicDoctorDetailsController);

export default router;