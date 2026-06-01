import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { uploadBookingReport } from "../../middlewares/upload.middleware.js";

import {
  deleteDraftReportController,
  getMyDraftReportsController,
  uploadBookingReportController,
} from "./report.controller.js";

const router = express.Router();

router.post(
  "/booking-upload",
  protect,
  uploadBookingReport,
  uploadBookingReportController
);

router.get(
  "/drafts",
  protect,
  getMyDraftReportsController
);

router.delete(
  "/drafts/:reportId",
  protect,
  deleteDraftReportController
);

export default router;