import express from "express";

import {
  getPublicDoctorAvailableSlotsController,
  getPublicDoctorDetailsController,
  getPublicDoctorsController,
} from "./publicDoctor.controller.js";

const router = express.Router();

router.get("/", getPublicDoctorsController);

router.get(
  "/:doctorId/available-slots",
  getPublicDoctorAvailableSlotsController
);

router.get("/:doctorId", getPublicDoctorDetailsController);

export default router;