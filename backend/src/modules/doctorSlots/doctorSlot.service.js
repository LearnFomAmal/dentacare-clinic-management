import AppError from "../../shared/errors/AppError.js";

import {
  createDoctorSlotDay,
  findSlotDayByDoctorAndDate,
  findSlotDaysByDoctorAndDateRange,
  findSlotDayByIdAndDoctor,
  saveSlotDay,
} from "./doctorSlot.repository.js";

import {
  validateDateString,
  validateEditSlotInput,
  validateObjectId,
  validateRecurringInput,
  validateSlotInput,
} from "./doctorSlot.validator.js";

// ==============================
// CONSTANTS
// ==============================
const DEFAULT_SLOTS = [
  {
    startTime: "09:00",
    endTime: "10:00",
    type: "default",
    status: "available",
    isDeleted: false,
  },
  {
    startTime: "10:00",
    endTime: "11:00",
    type: "default",
    status: "available",
    isDeleted: false,
  },
  {
    startTime: "11:30",
    endTime: "12:30",
    type: "default",
    status: "available",
    isDeleted: false,
  },
  {
    startTime: "12:30",
    endTime: "13:30",
    type: "default",
    status: "available",
    isDeleted: false,
  },
  {
    startTime: "15:00",
    endTime: "16:00",
    type: "default",
    status: "available",
    isDeleted: false,
  },
  {
    startTime: "16:00",
    endTime: "17:00",
    type: "default",
    status: "available",
    isDeleted: false,
  },
];

const MAX_EXTRA_SLOTS_PER_DAY = 2;
const MIN_SLOT_DURATION_MINUTES = 15;
const MAX_SLOT_DURATION_MINUTES = 120;

// ==============================
// DATE + TIME HELPERS
// ==============================
const getDateObject = (dateString) => {
  return new Date(`${dateString}T00:00:00.000Z`);
};

const getDayOfWeek = (dateString) => {
  return getDateObject(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
};

const isSunday = (dateString) => {
  return getDayOfWeek(dateString) === "Sunday";
};

const addDays = (dateString, days) => {
  const date = getDateObject(dateString);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().split("T")[0];
};

const getDateRange = (startDate, days) => {
  return Array.from({ length: days }, (_, index) =>
    addDays(startDate, index)
  );
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getSlotDuration = (startTime, endTime) => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

const hasTimeConflict = (
  slots,
  startTime,
  endTime,
  ignoredSlotId = null
) => {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  return slots.some((slot) => {
    if (slot.isDeleted) return false;
    if (slot.status === "blocked") return false;

    if (
      ignoredSlotId &&  
      slot._id.toString() === ignoredSlotId.toString()
    ) {
      return false;
    }

    const existingStart = timeToMinutes(slot.startTime);
    const existingEnd = timeToMinutes(slot.endTime);

    return newStart < existingEnd && newEnd > existingStart;
  });
};
const buildFreshDefaultSlots = () => {
  return DEFAULT_SLOTS.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    type: "default",
    status: "available",
    isDeleted: false,
  }));
};

const validateSlotDuration = (startTime, endTime) => {
  const duration = getSlotDuration(startTime, endTime);

  if (duration <= 0) {
    throw new AppError(
      "End time must be after start time",
      400
    );
  }

  if (duration < MIN_SLOT_DURATION_MINUTES) {
    throw new AppError(
      `Slot duration must be at least ${MIN_SLOT_DURATION_MINUTES} minutes`,
      400
    );
  }

  if (duration > MAX_SLOT_DURATION_MINUTES) {
    throw new AppError(
      `Slot duration cannot exceed ${MAX_SLOT_DURATION_MINUTES} minutes`,
      400
    );
  }
};

const getActiveSlots = (slotDay) => {
  return slotDay.slots.filter(
    (slot) => !slot.isDeleted && slot.status !== "blocked"
  );
};

const hasBookedSlot = (slotDay) => {
  return slotDay.slots.some(
    (slot) => !slot.isDeleted && slot.status === "booked"
  );
};

// ==============================
// ENSURE SLOT DAY EXISTS
// ==============================
const buildDefaultSlotDayPayload = (doctorId, date) => {
  const dayOfWeek = getDayOfWeek(date);
  const holiday = dayOfWeek === "Sunday";

  return {
    doctorId,
    date,
    dayOfWeek,
    isHoliday: holiday,
    slots: holiday ? [] : buildFreshDefaultSlots(),
  };
};

const ensureSlotDay = async (doctorId, date) => {
  validateDateString(date);

  let slotDay = await findSlotDayByDoctorAndDate(
    doctorId,
    date
  );

  if (slotDay) {
    return slotDay;
  }

  slotDay = await createDoctorSlotDay(
    buildDefaultSlotDayPayload(doctorId, date)
  );

  return slotDay;
};

// ==============================
// SERVICES
// ==============================
export const getDoctorSlotsService = async (
  doctorId,
  query
) => {
  const startDate =
    query.startDate ||
    new Date().toISOString().split("T")[0];

const days =
  query.days === undefined ? 7 : Number(query.days);

if (!Number.isInteger(days) || days < 1 || days > 14) {
  throw new AppError("Days must be between 1 and 14", 400);
}

  validateDateString(startDate);

  if (days < 1 || days > 14) {
    throw new AppError("Days must be between 1 and 14", 400);
  }

  const dates = getDateRange(startDate, days);

  const existingSlotDays =
    await findSlotDaysByDoctorAndDateRange(
      doctorId,
      dates
    );

  const existingDateSet = new Set(
    existingSlotDays.map((item) => item.date)
  );

  const missingDates = dates.filter(
    (date) => !existingDateSet.has(date)
  );

  if (missingDates.length > 0) {
    await Promise.all(
      missingDates.map((date) =>
        createDoctorSlotDay(
          buildDefaultSlotDayPayload(doctorId, date)
        )
      )
    );
  }

  const finalSlotDays =
    await findSlotDaysByDoctorAndDateRange(
      doctorId,
      dates
    );

  return finalSlotDays;
};

export const addDoctorSlotService = async (
  doctorId,
  payload
) => {
  validateSlotInput(payload);

  const { date, startTime, endTime } = payload;

  if (isSunday(date)) {
    throw new AppError(
      "Cannot add slots on Sunday holiday",
      400
    );
  }

  validateSlotDuration(startTime, endTime);

  const slotDay = await ensureSlotDay(doctorId, date);

  if (slotDay.isHoliday) {
    throw new AppError(
      "Cannot add slots on holiday",
      400
    );
  }

  const extraSlotsCount = slotDay.slots.filter(
    (slot) =>
      slot.type === "extra" &&
      !slot.isDeleted &&
      slot.status !== "blocked"
  ).length;

  if (extraSlotsCount >= MAX_EXTRA_SLOTS_PER_DAY) {
    throw new AppError(
      `Only ${MAX_EXTRA_SLOTS_PER_DAY} extra slots are allowed per day`,
      400
    );
  }

  if (
    hasTimeConflict(
      slotDay.slots,
      startTime,
      endTime
    )
  ) {
    throw new AppError(
      "Slot time conflicts with an existing slot",
      400
    );
  }

  slotDay.slots.push({
    startTime,
    endTime,
    type: "extra",
    status: "available",
    isDeleted: false,
  });

  await saveSlotDay(slotDay);

  return slotDay;
};

export const editDoctorSlotService = async (
  doctorId,
  slotDayId,
  slotId,
  payload
) => {
  validateObjectId(slotDayId, "slot day id");
  validateObjectId(slotId, "slot id");
  validateEditSlotInput(payload);

  const { startTime, endTime } = payload;

  validateSlotDuration(startTime, endTime);

  const slotDay = await findSlotDayByIdAndDoctor(
    slotDayId,
    doctorId
  );

  if (!slotDay) {
    throw new AppError("Slot day not found", 404);
  }

  if (slotDay.isHoliday) {
    throw new AppError(
      "Cannot edit slots on holiday",
      400
    );
  }

  const slot = slotDay.slots.id(slotId);

  if (!slot || slot.isDeleted) {
    throw new AppError("Slot not found", 404);
  }

  if (slot.status === "booked") {
    throw new AppError(
      "Booked slot cannot be edited",
      400
    );
  }

  if (
    hasTimeConflict(
      slotDay.slots,
      startTime,
      endTime,
      slotId
    )
  ) {
    throw new AppError(
      "Slot time conflicts with an existing slot",
      400
    );
  }

  slot.startTime = startTime;
  slot.endTime = endTime;
  slot.status = "available";

  await saveSlotDay(slotDay);

  return slotDay;
};

export const deleteDoctorSlotService = async (
  doctorId,
  slotDayId,
  slotId
) => {
  validateObjectId(slotDayId, "slot day id");
  validateObjectId(slotId, "slot id");

  const slotDay = await findSlotDayByIdAndDoctor(
    slotDayId,
    doctorId
  );

  if (!slotDay) {
    throw new AppError("Slot day not found", 404);
  }

  if (isSunday(slotDay.date)) {
    throw new AppError(
      "Sunday is a fixed holiday. Slots cannot be deleted.",
      400
    );
  }

  if (slotDay.isHoliday) {
    throw new AppError(
      "Cannot delete slots from a holiday date",
      400
    );
  }

  const slot = slotDay.slots.id(slotId);

  if (!slot || slot.isDeleted) {
    throw new AppError("Slot not found", 404);
  }

  if (slot.status === "booked") {
    throw new AppError(
      "Booked slot cannot be deleted",
      400
    );
  }

  // Default and extra slots can both be deleted now.
  slot.isDeleted = true;
  slot.status = "blocked";

  const remainingActiveSlots = slotDay.slots.filter(
    (item) =>
      !item.isDeleted &&
      item.status !== "blocked"
  );

  // If doctor deleted the last active slot,
  // automatically make this date unavailable.
  if (remainingActiveSlots.length === 0) {
    slotDay.isHoliday = true;
    slotDay.slots = [];
  }

  await saveSlotDay(slotDay);

  return slotDay;
};

export const applyRecurringSlotsService = async (
  doctorId,
  payload
) => {
  validateRecurringInput(payload);

  const { sourceDate } = payload;
  const repeatDays = Number(payload.repeatDays);

  const sourceSlotDay = await ensureSlotDay(
    doctorId,
    sourceDate
  );

  if (sourceSlotDay.isHoliday) {
    throw new AppError(
      "Cannot apply recurring from holiday",
      400
    );
  }

  const sourceSlots = getActiveSlots(sourceSlotDay);

  if (sourceSlots.length === 0) {
    throw new AppError(
      "No active slots found to repeat",
      400
    );
  }

  const copiedDates = [];
  const skippedDates = [];

  for (let i = 1; i <= repeatDays; i += 1) {
    const targetDate = addDays(sourceDate, i);

    if (isSunday(targetDate)) {
      skippedDates.push({
        date: targetDate,
        reason: "Sunday holiday",
      });
      continue;
    }

    const targetSlotDay = await ensureSlotDay(
      doctorId,
      targetDate
    );

    if (hasBookedSlot(targetSlotDay)) {
      skippedDates.push({
        date: targetDate,
        reason: "Date has booked slots",
      });
      continue;
    }

    targetSlotDay.isHoliday = false;
    targetSlotDay.dayOfWeek = getDayOfWeek(targetDate);

    targetSlotDay.slots = sourceSlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type,
      status: "available",
      isDeleted: false,
    }));

    await saveSlotDay(targetSlotDay);

    copiedDates.push(targetDate);
  }

  return {
    sourceDate,
    repeatDays,
    copiedDates,
    skippedDates,
  };
};

export const markSlotDayHolidayService = async (
  doctorId,
  slotDayId
) => {
  validateObjectId(slotDayId, "slot day id");

  const slotDay = await findSlotDayByIdAndDoctor(
    slotDayId,
    doctorId
  );

  if (!slotDay) {
    throw new AppError("Slot day not found", 404);
  }

  if (isSunday(slotDay.date)) {
    throw new AppError(
      "Sunday is already a fixed holiday",
      400
    );
  }

  if (slotDay.isHoliday) {
    throw new AppError(
      "This date is already marked as holiday",
      400
    );
  }

  if (hasBookedSlot(slotDay)) {
    throw new AppError(
      "Cannot mark this date as holiday because it has booked slots",
      400
    );
  }

  slotDay.isHoliday = true;
  slotDay.slots = [];

  await saveSlotDay(slotDay);

  return slotDay;
};

export const undoSlotDayHolidayService = async (
  doctorId,
  slotDayId
) => {
  validateObjectId(slotDayId, "slot day id");

  const slotDay = await findSlotDayByIdAndDoctor(
    slotDayId,
    doctorId
  );

  if (!slotDay) {
    throw new AppError("Slot day not found", 404);
  }

  if (isSunday(slotDay.date)) {
    throw new AppError(
      "Sunday holiday cannot be changed",
      400
    );
  }

  if (!slotDay.isHoliday) {
    throw new AppError(
      "This date is not marked as holiday",
      400
    );
  }

  slotDay.isHoliday = false;
  slotDay.dayOfWeek = getDayOfWeek(slotDay.date);
  slotDay.slots = buildFreshDefaultSlots();

  await saveSlotDay(slotDay);

  return slotDay;
};

export const restoreDefaultSlotsService = async (
  doctorId,
  slotDayId
) => {
  validateObjectId(slotDayId, "slot day id");

  const slotDay = await findSlotDayByIdAndDoctor(
    slotDayId,
    doctorId
  );

  if (!slotDay) {
    throw new AppError("Slot day not found", 404);
  }

  if (isSunday(slotDay.date)) {
    throw new AppError(
      "Sunday is a fixed holiday. Default slots cannot be restored on Sunday.",
      400
    );
  }

  if (hasBookedSlot(slotDay)) {
    throw new AppError(
      "Cannot restore defaults because this date has booked slots",
      400
    );
  }

  slotDay.isHoliday = false;
  slotDay.dayOfWeek = getDayOfWeek(slotDay.date);
  slotDay.slots = buildFreshDefaultSlots();

  await saveSlotDay(slotDay);

  return slotDay;
};