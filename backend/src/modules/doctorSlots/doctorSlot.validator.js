import mongoose from "mongoose";
import AppError from "../../shared/errors/AppError.js";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

export const validateDateString = (date) => {
  if (!date) {
    throw new AppError("Date is required", 400);
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(date)) {
    throw new AppError("Date must be in YYYY-MM-DD format", 400);
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Invalid date", 400);
  }
};

export const validateTime = (time, fieldName) => {
  if (!time) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (!TIME_REGEX.test(time)) {
    throw new AppError(
      `${fieldName} must be in HH:mm format`,
      400
    );
  }
};

export const validateSlotInput = (payload) => {
  validateDateString(payload.date);
  validateTime(payload.startTime, "Start time");
  validateTime(payload.endTime, "End time");
};

export const validateEditSlotInput = (payload) => {
  validateTime(payload.startTime, "Start time");
  validateTime(payload.endTime, "End time");
};

export const validateRecurringInput = (payload) => {
  validateDateString(payload.sourceDate);

  const allowedRepeatDays = [1, 2, 7];

  if (!allowedRepeatDays.includes(Number(payload.repeatDays))) {
    throw new AppError(
      "Repeat days must be 1, 2, or 7",
      400
    );
  }
};
