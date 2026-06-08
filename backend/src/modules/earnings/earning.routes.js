import express from "express";

import { protectDoctor } from "../../middlewares/doctorAuth.middleware.js";
import { protectAdmin } from "../../middlewares/adminAuth.middleware.js";

import {
  getAdminDoctorEarningsController,
  getMyDoctorEarningsController,
} from "./earning.controller.js";

const router = express.Router();

router.get("/doctor/me", protectDoctor, getMyDoctorEarningsController);

router.get(
  "/admin/doctors/:doctorId",
  protectAdmin,
  getAdminDoctorEarningsController
);

export default router;