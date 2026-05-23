import express from "express";

import {
  getPatientAppointmentDetailsController,
  initiateAppointmentController,
} from "./appointment.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/initiate",
  protect,
  initiateAppointmentController
);

router.get(
  "/:appointmentId",
  protect,
  getPatientAppointmentDetailsController
);

export default router;