import mongoose from "mongoose";
import AppError from "../../shared/errors/AppError.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const validateObjectId = (id, fieldName) => {
  if (!id || !isValidObjectId(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateDateString = (date) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!date || !regex.test(date)) {
    throw new AppError("Invalid appointment date", 400);
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Invalid appointment date", 400);
  }
};

export const validateInitiateAppointmentInput = (body) => {
  const {
    doctorId,
    slotDayId,
    slotId,
    appointmentDate,
    reason,
    reportIds = [],
  } = body;

  validateObjectId(doctorId, "doctor id");
  validateObjectId(slotDayId, "slot day id");
  validateObjectId(slotId, "slot id");
  validateDateString(appointmentDate);

  if (!reason || !reason.trim()) {
    throw new AppError("Appointment reason is required", 400);
  }

  if (reason.trim().length < 5) {
    throw new AppError(
      "Appointment reason must be at least 5 characters",
      400
    );
  }

  if (reason.trim().length > 500) {
    throw new AppError(
      "Appointment reason cannot exceed 500 characters",
      400
    );
  }

  if (!Array.isArray(reportIds)) {
    throw new AppError("Report ids must be an array", 400);
  }

  reportIds.forEach((reportId) => {
    validateObjectId(reportId, "report id");
  });
};