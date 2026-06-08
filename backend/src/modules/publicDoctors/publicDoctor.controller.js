import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  getPublicDoctorAvailableSlotsService,
  getPublicDoctorDetailsService,
  getPublicDoctorsService,
} from "./publicDoctor.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

export const getPublicDoctorsController = asyncHandler(async (req, res) => {
  const data = await getPublicDoctorsService(req.query);

  sendResponse(res, 200, true, "Doctors fetched successfully", data);
});

export const getPublicDoctorDetailsController = asyncHandler(
  async (req, res) => {
    const doctor = await getPublicDoctorDetailsService(req.params.doctorId);

    sendResponse(
      res,
      200,
      true,
      "Doctor details fetched successfully",
      doctor
    );
  }
);

export const getPublicDoctorAvailableSlotsController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientId(req);

    const data = await getPublicDoctorAvailableSlotsService({
      doctorId: req.params.doctorId,
      query: req.query,
      patientId,
    });

    sendResponse(
      res,
      200,
      true,
      "Available slots fetched successfully",
      data
    );
  }
);