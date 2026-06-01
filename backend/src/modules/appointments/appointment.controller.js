import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  approveAppointmentByAdminService,
  approveAppointmentByDoctorService,
  getAdminAppointmentDetailsService,
  getAdminAppointmentsService,
  getDoctorAppointmentDetailsService,
  getDoctorAppointmentsService,
  getMyAppointmentsService,
  getPatientAppointmentDetailsService,
  initiateAppointmentService,
  rejectAppointmentByAdminService,
  rejectAppointmentByDoctorService,
} from "./appointment.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

const getDoctorId = (req) => {
  return req.doctor?.doctorId || req.doctor?._id || req.doctor?.id;
};

export const initiateAppointmentController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientId(req);

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
    const patientId = getPatientId(req);

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

export const getMyAppointmentsController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientId(req);

    const appointments = await getMyAppointmentsService({
      patientId,
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "My appointments fetched successfully",
      appointments
    );
  }
);

export const getDoctorAppointmentsController = asyncHandler(
  async (req, res) => {
    const doctorId = getDoctorId(req);

    const appointments = await getDoctorAppointmentsService({
      doctorId,
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Doctor appointments fetched successfully",
      appointments
    );
  }
);

export const getDoctorAppointmentDetailsController = asyncHandler(
  async (req, res) => {
    const doctorId = getDoctorId(req);

    const appointment = await getDoctorAppointmentDetailsService({
      doctorId,
      appointmentId: req.params.appointmentId,
    });

    sendResponse(
      res,
      200,
      true,
      "Doctor appointment details fetched successfully",
      appointment
    );
  }
);

export const getAdminAppointmentsController = asyncHandler(
  async (req, res) => {
    const appointments = await getAdminAppointmentsService({
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Admin appointments fetched successfully",
      appointments
    );
  }
);

export const getAdminAppointmentDetailsController = asyncHandler(
  async (req, res) => {
    const appointment = await getAdminAppointmentDetailsService({
      appointmentId: req.params.appointmentId,
    });

    sendResponse(
      res,
      200,
      true,
      "Admin appointment details fetched successfully",
      appointment
    );
  }
);

export const approveAppointmentByDoctorController = asyncHandler(
  async (req, res) => {
    const doctorId = getDoctorId(req);

    const appointment = await approveAppointmentByDoctorService({
      doctorId,
      appointmentId: req.params.appointmentId,
    });

    sendResponse(
      res,
      200,
      true,
      "Appointment approved successfully",
      appointment
    );
  }
);

export const rejectAppointmentByDoctorController = asyncHandler(
  async (req, res) => {
    const doctorId = getDoctorId(req);

    const appointment = await rejectAppointmentByDoctorService({
      doctorId,
      appointmentId: req.params.appointmentId,
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Appointment rejected successfully",
      appointment
    );
  }
);

export const approveAppointmentByAdminController = asyncHandler(
  async (req, res) => {
    const appointment = await approveAppointmentByAdminService({
      appointmentId: req.params.appointmentId,
    });

    sendResponse(
      res,
      200,
      true,
      "Appointment approved by admin successfully",
      appointment
    );
  }
);

export const rejectAppointmentByAdminController = asyncHandler(
  async (req, res) => {
    const appointment = await rejectAppointmentByAdminService({
      appointmentId: req.params.appointmentId,
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Appointment rejected by admin successfully",
      appointment
    );
  }
);