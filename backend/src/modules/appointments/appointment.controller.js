import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  getPatientAppointmentDetailsService,
  initiateAppointmentService,
} from "./appointment.service.js";

export const initiateAppointmentController = asyncHandler(
  async (req, res) => {
    const patientId = req.user?.userId || req.user?._id || req.user?.id;

    const appointment = await initiateAppointmentService({
      patientId,
      body: req.body,
    });

    sendResponse(
      res,
      201,
      true,
      "Appointment initiated successfully",
      appointment
    );
  }
);

export const getPatientAppointmentDetailsController = asyncHandler(
  async (req, res) => {
    const patientId = req.user?.userId || req.user?._id || req.user?.id;

    const appointment = await getPatientAppointmentDetailsService({
      patientId,
      appointmentId: req.params.appointmentId,
    });

    sendResponse(
      res,
      200,
      true,
      "Appointment details fetched successfully",
      appointment
    );
  }
);