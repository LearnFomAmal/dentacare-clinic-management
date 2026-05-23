import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

import {
  createAppointment,
  findAppointmentByIdForPatient,
  findDoctorForBooking,
  findExistingPendingPaymentAppointment,
  findPatientReportsByIds,
  findSlotDayForBooking,
} from "./appointment.repository.js";

import {
  validateInitiateAppointmentInput,
  validateObjectId,
} from "./appointment.validator.js";

const getReportFileUrl = (report) => {
  return (
    report?.file?.url ||
    report?.fileUrl ||
    report?.url ||
    ""
  );
};

const normalizeAppointmentReport = (report) => {
  return {
    reportId: report._id,
    title: report.title || "",
    reportType: report.reportType || "other",
    fileUrl: getReportFileUrl(report),
  };
};

export const initiateAppointmentService = async ({
  patientId,
  body,
}) => {
  validateObjectId(patientId, "patient id");
  validateInitiateAppointmentInput(body);

  const {
    doctorId,
    slotDayId,
    slotId,
    appointmentDate,
    reason,
    reportIds = [],
  } = body;

  const doctor = await findDoctorForBooking(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (doctor.accountStatus?.isDeleted) {
    throw new AppError("Doctor account is deleted", 400);
  }

  if (doctor.accountStatus?.isBlocked) {
    throw new AppError("Doctor is currently unavailable", 400);
  }

  if (!doctor.accountStatus?.isVerified) {
    throw new AppError("Doctor is not verified", 400);
  }

  const slotDay = await findSlotDayForBooking({
    slotDayId,
    doctorId,
  });

  if (!slotDay) {
    throw new AppError("Slot day not found", 404);
  }

  if (slotDay.date !== appointmentDate) {
    throw new AppError(
      "Selected slot date does not match appointment date",
      400
    );
  }

  if (slotDay.isHoliday) {
    throw new AppError("Cannot book appointment on holiday", 400);
  }

  const selectedSlot = slotDay.slots.id(slotId);

  if (!selectedSlot || selectedSlot.isDeleted) {
    throw new AppError("Selected slot not found", 404);
  }

  if (selectedSlot.status !== "available") {
    throw new AppError("Selected slot is not available", 400);
  }

  const existingPendingAppointment =
    await findExistingPendingPaymentAppointment({
      patientId,
      doctorId,
      appointmentDate,
      slotId,
    });

  if (existingPendingAppointment) {
    return existingPendingAppointment;
  }

  let appointmentReports = [];

  if (reportIds.length > 0) {
    const reports = await findPatientReportsByIds({
      patientId,
      reportIds,
    });

    if (reports.length !== reportIds.length) {
      throw new AppError(
        "One or more selected reports are invalid",
        400
      );
    }

    appointmentReports = reports.map(normalizeAppointmentReport);
  }

  const consultationFee =
    doctor.professionalInfo?.consultationFee || 0;

  const totalDiscount = 0;
  const finalAmount = consultationFee - totalDiscount;

  const appointment = await createAppointment({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    slotDayId: new mongoose.Types.ObjectId(slotDayId),
    slotId: new mongoose.Types.ObjectId(slotId),

    appointmentDate,
    startTime: selectedSlot.startTime,
    endTime: selectedSlot.endTime,

    reason: reason.trim(),

    reports: appointmentReports,

    status: "pending_payment",
    paymentStatus: "unpaid",

    pricing: {
      consultationFee,
      totalDiscount,
      finalAmount,
    },
  });

  return appointment;
};

export const getPatientAppointmentDetailsService = async ({
  patientId,
  appointmentId,
}) => {
  validateObjectId(patientId, "patient id");
  validateObjectId(appointmentId, "appointment id");

  const appointment = await findAppointmentByIdForPatient({
    patientId,
    appointmentId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return appointment;
};