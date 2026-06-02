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

  if (!appointmentDate || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    throw new AppError("Valid appointment date is required", 400);
  }

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