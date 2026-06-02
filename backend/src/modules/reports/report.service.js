import { v2 as cloudinary } from "cloudinary";

import { env } from "../../config/env.js";
import AppError from "../../shared/errors/AppError.js";

import {
  addReportSummaryToAppointment,
  createReport,
  findAppointmentReportsForDoctor,
  findAppointmentReportsForPatient,
  findCompletedAppointmentForDoctor,
  findDoctorAppointmentForReports,
  findDraftReportByIdAndPatient,
  findDraftReportsByPatient,
  findPatientAppointmentForReports,
  updateReportById,
} from "./report.repository.js";

import {
  validateDoctorPrescriptionInput,
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

const buildFilePayload = ({ uploadedFile, file }) => {
  if (!uploadedFile || !file) {
    return {
      url: "",
      publicId: "",
      originalName: "",
      mimeType: "",
      size: 0,
    };
  }

  return {
    url: uploadedFile.secure_url,
    publicId: uploadedFile.public_id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
};

export const uploadBookingReportService = async ({
  patientId,
  body,
  file,
}) => {
  validateObjectId(patientId, "patient id");
  validateUploadReportInput(body, file);

  const uploadedFile = await uploadBufferToCloudinary(file);

  const report = await createReport({
    patientId,
    uploadedBy: "patient",

    title: body.title.trim(),
    reportType: body.reportType || "other",
    description: body.description?.trim() || "",

    file: buildFilePayload({
      uploadedFile,
      file,
    }),

    status: "draft",
    isVisibleToDoctor: true,
    isVisibleToPatient: true,
  });

  return report;
};

export const getMyDraftReportsService = async (patientId) => {
  validateObjectId(patientId, "patient id");

  return findDraftReportsByPatient(patientId);
};

export const deleteDraftReportService = async (patientId, reportId) => {
  validateObjectId(patientId, "patient id");
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

export const uploadDoctorPrescriptionService = async ({
  doctorId,
  appointmentId,
  body,
  file,
}) => {
  validateObjectId(doctorId, "doctor id");
  validateObjectId(appointmentId, "appointment id");
  validateDoctorPrescriptionInput(body, file);

  const appointment = await findCompletedAppointmentForDoctor({
    appointmentId,
    doctorId,
  });

  if (!appointment) {
    throw new AppError(
      "Prescription can be uploaded only after completing your own paid appointment",
      400
    );
  }

  let uploadedFile = null;

  if (file) {
    uploadedFile = await uploadBufferToCloudinary(
      file,
      "dentacare/prescriptions"
    );
  }

  const report = await createReport({
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,

    uploadedBy: "doctor",
    title: body.title.trim(),
    reportType: "prescription",
    description: body.description?.trim() || "",
    prescriptionText: body.prescriptionText.trim(),

    file: buildFilePayload({
      uploadedFile,
      file,
    }),

    status: "attached",
    isVisibleToDoctor: true,
    isVisibleToPatient: true,
  });

  await addReportSummaryToAppointment({
    appointmentId: appointment._id,
    report,
  });

  return report;
};

export const getPatientAppointmentReportsService = async ({
  patientId,
  appointmentId,
}) => {
  validateObjectId(patientId, "patient id");
  validateObjectId(appointmentId, "appointment id");

  const appointment = await findPatientAppointmentForReports({
    appointmentId,
    patientId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return findAppointmentReportsForPatient({
    appointmentId,
    patientId,
  });
};

export const getDoctorAppointmentReportsService = async ({
  doctorId,
  appointmentId,
}) => {
  validateObjectId(doctorId, "doctor id");
  validateObjectId(appointmentId, "appointment id");

  const appointment = await findDoctorAppointmentForReports({
    appointmentId,
    doctorId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return findAppointmentReportsForDoctor({
    appointmentId,
    doctorId,
  });
};