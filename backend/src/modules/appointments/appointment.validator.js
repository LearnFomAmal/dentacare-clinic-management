import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

const VALID_REJECTION_REASON_TYPES = [
  "invalid_booking",
  "policy_violation",
  "duplicate_appointment",
  "doctor_unavailable",
  "other",
];

const VALID_CANCELLATION_REASON_TYPES = [
  "personal_reason",
  "medical_emergency",
  "doctor_unavailable",
  "schedule_conflict",
  "wrong_booking",
  "other",
];

const VALID_RESCHEDULE_REASON_TYPES = [
  "personal_reason",
  "medical_emergency",
  "schedule_conflict",
  "doctor_requested",
  "other",
];

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
  couponCode = "",
  allowTimeConflict = false,
} = body;

  if (!doctorId) {
    throw new AppError("Doctor id is required", 400);
  }

  if (!slotDayId) {
    throw new AppError("Slot day id is required", 400);
  }

  if (!slotId) {
    throw new AppError("Slot id is required", 400);
  }

  validateObjectId(doctorId, "doctor id");
  validateObjectId(slotDayId, "slot day id");
  validateObjectId(slotId, "slot id");

  validateDateString(appointmentDate);

  if (!reason || !reason.trim()) {
    throw new AppError("Reason for appointment is required", 400);
  }

  if (reason.trim().length > 500) {
    throw new AppError("Reason cannot exceed 500 characters", 400);
  }

  if (!Array.isArray(reportIds)) {
    throw new AppError("Report ids must be an array", 400);
  }

  reportIds.forEach((reportId) => {
    validateObjectId(reportId, "report id");
  });

  if (couponCode && typeof couponCode !== "string") {
    throw new AppError("Coupon code must be a string", 400);
  }
  if (typeof allowTimeConflict !== "boolean") {
  throw new AppError("Invalid time conflict confirmation value", 400);
}
};

export const validateAppointmentStatusFilter = (status) => {
  if (!status) return;

const allowedStatuses = [
  "pending_payment",
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
  "expired",
];

  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid appointment status filter", 400);
  }
};

export const validateRejectAppointmentInput = (body) => {
  const { reasonType, reason } = body;

  if (!reasonType || !VALID_REJECTION_REASON_TYPES.includes(reasonType)) {
    throw new AppError("Invalid rejection reason type", 400);
  }

  if (!reason || !reason.trim()) {
    throw new AppError("Rejection reason is required", 400);
  }

  if (reason.trim().length < 5) {
    throw new AppError("Rejection reason must be at least 5 characters", 400);
  }

  if (reason.trim().length > 300) {
    throw new AppError("Rejection reason cannot exceed 300 characters", 400);
  }
};

export const validateCancelAppointmentInput = (body) => {
  const { reasonType, reason } = body;

  if (!reasonType || !VALID_CANCELLATION_REASON_TYPES.includes(reasonType)) {
    throw new AppError("Invalid cancellation reason type", 400);
  }

  if (!reason || !reason.trim()) {
    throw new AppError("Cancellation reason is required", 400);
  }

  if (reason.trim().length < 5) {
    throw new AppError(
      "Cancellation reason must be at least 5 characters",
      400
    );
  }

  if (reason.trim().length > 300) {
    throw new AppError(
      "Cancellation reason cannot exceed 300 characters",
      400
    );
  }
};

export const validateRescheduleAppointmentInput = (body) => {
  const {
    newSlotDayId,
    newSlotId,
    newAppointmentDate,
    reasonType,
    reason,
  } = body;

  if (!newSlotDayId) {
    throw new AppError("New slot day id is required", 400);
  }

  if (!newSlotId) {
    throw new AppError("New slot id is required", 400);
  }

  validateObjectId(newSlotDayId, "new slot day id");
  validateObjectId(newSlotId, "new slot id");
  validateDateString(newAppointmentDate);

  if (!reasonType || !VALID_RESCHEDULE_REASON_TYPES.includes(reasonType)) {
    throw new AppError("Invalid reschedule reason type", 400);
  }

  if (!reason || !reason.trim()) {
    throw new AppError("Reschedule reason is required", 400);
  }

  if (reason.trim().length < 5) {
    throw new AppError(
      "Reschedule reason must be at least 5 characters",
      400
    );
  }

  if (reason.trim().length > 300) {
    throw new AppError(
      "Reschedule reason cannot exceed 300 characters",
      400
    );
  }
};