import express from "express";

import { protectDoctor } from "../../middlewares/doctorAuth.middleware.js";

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

router.get("/", protectDoctor, getDoctorSlotsController);

router.post("/", protectDoctor, addDoctorSlotController);

router.post("/recurring", protectDoctor, applyRecurringSlotsController);

router.patch(
  "/:slotDayId/holiday",
  protectDoctor,
  markSlotDayHolidayController
);

router.patch(
  "/:slotDayId/undo-holiday",
  protectDoctor,
  undoSlotDayHolidayController
);

router.patch(
  "/:slotDayId/slots/:slotId",
  protectDoctor,
  editDoctorSlotController
);

router.delete(
  "/:slotDayId/slots/:slotId",
  protectDoctor,
  deleteDoctorSlotController
);

router.patch(
  "/:slotDayId/restore-defaults",
  protectDoctor,
  restoreDefaultSlotsController
);

export default router;