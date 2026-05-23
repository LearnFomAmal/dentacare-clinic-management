import AppError from "../../shared/errors/AppError.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  deleteDraftReportService,
  getMyDraftReportsService,
  uploadBookingReportService,
} from "./report.service.js";

const getPatientIdFromRequest = (req) => {
  return (
    req.user?.userId ||
    req.user?._id ||
    req.user?.id ||
    req.patient?.userId
  );
};

export const uploadBookingReportController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientIdFromRequest(req);

    if (!patientId) {
      throw new AppError("Unauthorized access", 401);
    }

    const report = await uploadBookingReportService({
      patientId,
      body: req.body,
      file: req.file,
    });

    sendResponse(
      res,
      201,
      true,
      "Report uploaded successfully",
      report
    );
  }
);

export const getMyDraftReportsController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientIdFromRequest(req);

    if (!patientId) {
      throw new AppError("Unauthorized access", 401);
    }

    const reports = await getMyDraftReportsService(patientId);

    sendResponse(
      res,
      200,
      true,
      "Draft reports fetched successfully",
      reports
    );
  }
);

export const deleteDraftReportController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientIdFromRequest(req);

    if (!patientId) {
      throw new AppError("Unauthorized access", 401);
    }

    const result = await deleteDraftReportService(
      patientId,
      req.params.reportId
    );

    sendResponse(
      res,
      200,
      true,
      "Draft report deleted successfully",
      result
    );
  }
);