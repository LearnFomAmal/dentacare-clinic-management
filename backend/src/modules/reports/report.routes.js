import express from "express";
import multer from "multer";

import AppError from "../../shared/errors/AppError.js";
import { protect } from "../../middlewares/auth.middleware.js";

import {
  deleteDraftReportController,
  getMyDraftReportsController,
  uploadBookingReportController,
} from "./report.controller.js";

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(
      new AppError(
        "Only JPG, PNG, WEBP and PDF files are allowed",
        400
      )
    );
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/booking-upload",
  protect,
  upload.single("file"),
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