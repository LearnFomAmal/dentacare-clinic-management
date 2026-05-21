import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  addDoctorSlotService,
  applyRecurringSlotsService,
  deleteDoctorSlotService,
  editDoctorSlotService,
  getDoctorSlotsService,
} from "./doctorSlot.service.js";

export const getDoctorSlotsController = asyncHandler(
  async (req, res) => {
    const doctorId = req.doctor.doctorId;

    const slots = await getDoctorSlotsService(
      doctorId,
      req.query
    );

    sendResponse(
      res,
      200,
      true,
      "Doctor slots fetched successfully",
      slots
    );
  }
);

export const addDoctorSlotController = asyncHandler(
  async (req, res) => {
    const doctorId = req.doctor.doctorId;

    const slotDay = await addDoctorSlotService(
      doctorId,
      req.body
    );

    sendResponse(
      res,
      201,
      true,
      "Slot added successfully",
      slotDay
    );
  }
);

export const editDoctorSlotController = asyncHandler(
  async (req, res) => {
    const doctorId = req.doctor.doctorId;
    const { slotDayId, slotId } = req.params;

    const slotDay = await editDoctorSlotService(
      doctorId,
      slotDayId,
      slotId,
      req.body
    );

    sendResponse(
      res,
      200,
      true,
      "Slot updated successfully",
      slotDay
    );
  }
);

export const deleteDoctorSlotController = asyncHandler(
  async (req, res) => {
    const doctorId = req.doctor.doctorId;
    const { slotDayId, slotId } = req.params;

    const slotDay = await deleteDoctorSlotService(
      doctorId,
      slotDayId,
      slotId
    );

    sendResponse(
      res,
      200,
      true,
      "Slot deleted successfully",
      slotDay
    );
  }
);

export const applyRecurringSlotsController = asyncHandler(
  async (req, res) => {
    const doctorId = req.doctor.doctorId;

    const result = await applyRecurringSlotsService(
      doctorId,
      req.body
    );

    sendResponse(
      res,
      200,
      true,
      "Recurring slots applied successfully",
      result
    );
  }
);