import { v2 as cloudinary } from "cloudinary";

import { env } from "../../config/env.js";
import AppError from "../../shared/errors/AppError.js";

import {
  createReport,
  findDraftReportByIdAndPatient,
  findDraftReportsByPatient,
  updateReportById,
} from "./report.repository.js";

import {
  validateObjectId,
  validateUploadReportInput,
} from "./report.validator.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadBufferToCloudinary = (file, folder = "dentacare/reports") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

const deleteCloudinaryFileSafely = async (publicId) => {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
  } catch {
    // Do not block user flow if Cloudinary delete fails.
  }
};

export const uploadBookingReportService = async ({
  patientId,
  body,
  file,
}) => {
  validateUploadReportInput(body, file);

  const uploadedFile = await uploadBufferToCloudinary(file);

  const report = await createReport({
    patientId,
    uploadedBy: "patient",

    title: body.title.trim(),
    reportType: body.reportType || "other",
    description: body.description?.trim() || "",

    file: {
      url: uploadedFile.secure_url,
      publicId: uploadedFile.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },

    status: "draft",
    isVisibleToDoctor: true,
    isVisibleToPatient: true,
  });

  return report;
};

export const getMyDraftReportsService = async (patientId) => {
  return findDraftReportsByPatient(patientId);
};

export const deleteDraftReportService = async (patientId, reportId) => {
  validateObjectId(reportId, "report id");

  const report = await findDraftReportByIdAndPatient(
    reportId,
    patientId
  );

  if (!report) {
    throw new AppError("Draft report not found", 404);
  }

  await deleteCloudinaryFileSafely(report.file?.publicId);

  const deletedReport = await updateReportById(reportId, {
    status: "deleted",
  });

  return {
    _id: deletedReport._id,
  };
};