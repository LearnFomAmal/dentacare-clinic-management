import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import { getDoctorEarningsService } from "./earning.service.js";

const getDoctorId = (req) => {
  return req.doctor?.doctorId || req.doctor?._id || req.doctor?.id;
};

export const getMyDoctorEarningsController = asyncHandler(
  async (req, res) => {
    const doctorId = getDoctorId(req);

    const data = await getDoctorEarningsService({
      doctorId,
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Doctor earnings fetched successfully",
      data
    );
  }
);

export const getAdminDoctorEarningsController = asyncHandler(
  async (req, res) => {
    const data = await getDoctorEarningsService({
      doctorId: req.params.doctorId,
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Doctor earnings fetched successfully",
      data
    );
  }
);