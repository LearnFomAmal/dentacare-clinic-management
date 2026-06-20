import express from "express";

import {
  protectDoctor,
  requireVerifiedDoctor,
} from "../../middlewares/doctorAuth.middleware.js";

import {
  addDoctorSlotController,
  applyRecurringSlotsController,
  deleteDoctorSlotController,
  editDoctorSlotController,
  getDoctorSlotsController,
  markSlotDayHolidayController,
  undoSlotDayHolidayController,
  restoreDefaultSlotsController,
} from "./doctorSlot.controller.js";

const router = express.Router();

router.get("/", protectDoctor,requireVerifiedDoctor, getDoctorSlotsController);

router.post("/", protectDoctor,requireVerifiedDoctor, addDoctorSlotController);

router.post("/recurring", protectDoctor,requireVerifiedDoctor, applyRecurringSlotsController);

router.patch(
  "/:slotDayId/holiday",
  protectDoctor,
  requireVerifiedDoctor,
  markSlotDayHolidayController
);

router.patch(
  "/:slotDayId/undo-holiday",
  protectDoctor,
  requireVerifiedDoctor,
  undoSlotDayHolidayController
);

router.patch(
  "/:slotDayId/slots/:slotId",
  protectDoctor,
  requireVerifiedDoctor,
  editDoctorSlotController
);

router.delete(
  "/:slotDayId/slots/:slotId",
  protectDoctor,
  requireVerifiedDoctor,
  deleteDoctorSlotController
);

router.patch(
  "/:slotDayId/restore-defaults",
  protectDoctor,
  requireVerifiedDoctor,
  restoreDefaultSlotsController
);

export default router;