import AppError from "../../shared/errors/AppError.js";

import {
  countPublicDoctors,
  createDoctorSlotDay,
  findActiveSpecialties,
  findActiveSpecialtyById,
  findPublicDoctorById,
  findPublicDoctors,
  findSlotDayByDoctorAndDate,
} from "./publicDoctor.repository.js";

import {
  validateDateString,
  validateObjectId,
  validatePagination,
} from "./publicDoctor.validator.js";

const MIN_BOOKING_LEAD_MINUTES = 120;

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

// ==============================
// DATE HELPERS
// ==============================
const getTodayDateString = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const getDateObject = (dateString) => {
  return new Date(`${dateString}T00:00:00.000Z`);
};

const getDayOfWeek = (dateString) => {
  return getDateObject(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
};

const validateNotPastDate = (date) => {
  const today = getTodayDateString();

  if (date < today) {
    throw new AppError("Cannot fetch slots for a past date", 400);
  }
};

const buildSlotDateTime = ({ date, time }) => {
  return new Date(`${date}T${time}:00+05:30`);
};

const getSlotAvailabilityMeta = ({ date, slot, patientId = null }) => {
  const status = slot.status;

  const isReservedByMe =
    status === "reserved" &&
    patientId &&
    slot.reservedBy &&
    slot.reservedBy.toString() === patientId.toString();

  if (isReservedByMe) {
    return {
      isBookable: true,
      isReservedByMe: true,
      existingAppointmentId: slot.reservedAppointmentId
        ? slot.reservedAppointmentId.toString()
        : "",
      reservedUntil: slot.reservedUntil || null,
      unavailableReason: "",
      unavailableMessage: "",
      displayMessage: "Reserved for you",
    };
  }

  if (status === "booked") {
    return {
      isBookable: false,
      isReservedByMe: false,
      existingAppointmentId: "",
      reservedUntil: null,
      unavailableReason: "booked",
      unavailableMessage: "Booked",
      displayMessage: "Booked",
    };
  }

  if (status === "reserved") {
    return {
      isBookable: false,
      isReservedByMe: false,
      existingAppointmentId: "",
      reservedUntil: slot.reservedUntil || null,
      unavailableReason: "reserved",
      unavailableMessage: "Reserved",
      displayMessage: "Reserved",
    };
  }

  if (status === "blocked") {
    return {
      isBookable: false,
      isReservedByMe: false,
      existingAppointmentId: "",
      reservedUntil: null,
      unavailableReason: "blocked",
      unavailableMessage: "Blocked",
      displayMessage: "Blocked",
    };
  }

  const slotStart = buildSlotDateTime({
    date,
    time: slot.startTime,
  });

  const now = new Date();

  const minimumAllowedStart = new Date(
    now.getTime() + MIN_BOOKING_LEAD_MINUTES * 60 * 1000
  );

  if (slotStart <= now) {
    return {
      isBookable: false,
      isReservedByMe: false,
      existingAppointmentId: "",
      reservedUntil: null,
      unavailableReason: "expired",
      unavailableMessage: "Expired",
      displayMessage: "Expired",
    };
  }

  if (slotStart < minimumAllowedStart) {
    return {
      isBookable: false,
      isReservedByMe: false,
      existingAppointmentId: "",
      reservedUntil: null,
      unavailableReason: "too_soon",
      unavailableMessage: "Too soon",
      displayMessage: "Too soon",
    };
  }

  return {
    isBookable: true,
    isReservedByMe: false,
    existingAppointmentId: "",
    reservedUntil: null,
    unavailableReason: "",
    unavailableMessage: "",
    displayMessage: "",
  };
};

// ==============================
// SLOT DAY HELPERS
// ==============================
const buildFreshDefaultSlots = () => {
  return DEFAULT_SLOTS.map((slot) => ({
    ...slot,
  }));
};

const buildDefaultSlotDayPayload = (doctorId, date) => {
  const dayOfWeek = getDayOfWeek(date);
  const isHoliday = dayOfWeek === "Sunday";

  return {
    doctorId,
    date,
    dayOfWeek,
    isHoliday,
    slots: isHoliday ? [] : buildFreshDefaultSlots(),
  };
};

const clearExpiredReservations = async (slotDay) => {
  if (!slotDay || slotDay.isHoliday) {
    return slotDay;
  }

  const now = new Date();
  let changed = false;

  slotDay.slots.forEach((slot) => {
    const isExpiredReservation =
      slot.status === "reserved" &&
      slot.reservedUntil &&
      slot.reservedUntil < now;

    if (isExpiredReservation) {
      slot.status = "available";
      slot.reservedBy = null;
      slot.reservedAppointmentId = null;
      slot.reservedUntil = null;
      changed = true;
    }
  });

  if (changed) {
    await slotDay.save();
  }

  return slotDay;
};

const ensureSlotDay = async (doctorId, date) => {
  let slotDay = await findSlotDayByDoctorAndDate(doctorId, date);

  if (slotDay) {
    return clearExpiredReservations(slotDay);
  }

  try {
    slotDay = await createDoctorSlotDay(
      buildDefaultSlotDayPayload(doctorId, date)
    );

    return slotDay;
  } catch (error) {
    if (error.code === 11000) {
      const existingSlotDay = await findSlotDayByDoctorAndDate(doctorId, date);
      return clearExpiredReservations(existingSlotDay);
    }

    throw error;
  }
};

const getVisibleSlots = (slotDay, patientId = null) => {
  if (!slotDay || slotDay.isHoliday) {
    return [];
  }

  const slotDayId = slotDay._id.toString();

  return slotDay.slots
    .filter((slot) => !slot.isDeleted)
    .map((slot) => {
      const availability = getSlotAvailabilityMeta({
        date: slotDay.date,
        slot,
        patientId,
      });

      return {
        _id: slot._id.toString(),
        slotDayId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: slot.type,
        status: slot.status,

        isBookable: availability.isBookable,
        isReservedByMe: availability.isReservedByMe,
        existingAppointmentId: availability.existingAppointmentId,
        reservedUntil: availability.reservedUntil,

        unavailableReason: availability.unavailableReason,
        unavailableMessage: availability.unavailableMessage,
        displayMessage: availability.displayMessage,
      };
    });
};

const getBookableSlots = (slotDay, patientId = null) => {
  return getVisibleSlots(slotDay, patientId).filter((slot) => slot.isBookable);
};

const formatDoctor = (doctor, availableSlotsToday = []) => {
  const fullName = [doctor.firstName, doctor.lastName]
    .filter(Boolean)
    .join(" ");

  return {
    _id: doctor._id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    fullName,
    email: doctor.email,

    specialization: {
      specialtyId: doctor.specialization?.specialtyId || null,
      name: doctor.specialization?.name || "",
      displayName:
        doctor.specialization?.displayName ||
        doctor.specialization?.name ||
        "",
    },

    professionalInfo: {
      experience: doctor.professionalInfo?.experience ?? 0,
      education: doctor.professionalInfo?.education || "",
      consultationFee: doctor.professionalInfo?.consultationFee ?? 0,
      contactNumber: doctor.professionalInfo?.contactNumber || "",
      profileImage: doctor.professionalInfo?.profileImage || "",
    },

    stats: {
      averageRating: doctor.stats?.averageRating ?? 0,
      totalReviews: doctor.stats?.totalReviews ?? 0,
      totalPatients: doctor.stats?.totalPatients ?? 0,
      totalAppointments: doctor.stats?.totalAppointments ?? 0,
    },

    availableSlotsToday,
  };
};

const getSortOption = (sort) => {
  if (sort === "experience_desc") {
    return {
      "professionalInfo.experience": -1,
      createdAt: -1,
    };
  }

  if (sort === "fee_asc") {
    return {
      "professionalInfo.consultationFee": 1,
      createdAt: -1,
    };
  }

  if (sort === "rating_desc") {
    return {
      "stats.averageRating": -1,
      createdAt: -1,
    };
  }

  return {
    createdAt: -1,
  };
};

// ==============================
// SERVICES
// ==============================
export const getPublicDoctorsService = async (query) => {
  const {
    search = "",
    specialtyId = "",
    minExperience = "",
    sort = "latest",
  } = query;

  const { page, limit } = validatePagination(query);

  const activeSpecialties = await findActiveSpecialties();
  const activeSpecialtyIds = activeSpecialties.map((item) => item._id);

  if (specialtyId) {
    validateObjectId(specialtyId, "specialty id");

    const activeSpecialty = await findActiveSpecialtyById(specialtyId);

    if (!activeSpecialty) {
      throw new AppError("Specialty not found or inactive", 404);
    }
  }

  const filter = {
    "accountStatus.isVerified": true,
    "accountStatus.isBlocked": false,
    "accountStatus.isDeleted": false,
    "specialization.specialtyId": specialtyId
      ? specialtyId
      : {
          $in: activeSpecialtyIds,
        },
  };

  if (search.trim()) {
    const regex = new RegExp(search.trim(), "i");

    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { "specialization.name": regex },
      { "specialization.displayName": regex },
    ];
  }

  if (minExperience !== "") {
    filter["professionalInfo.experience"] = {
      $gte: Number(minExperience),
    };
  }

  const skip = (page - 1) * limit;

  const [totalDoctors, doctors] = await Promise.all([
    countPublicDoctors(filter),
    findPublicDoctors({
      filter,
      skip,
      limit,
      sort: getSortOption(sort),
    }),
  ]);

  const today = getTodayDateString();

  const doctorsWithSlots = await Promise.all(
    doctors.map(async (doctor) => {
      const slotDay = await ensureSlotDay(doctor._id, today);
      const availableSlotsToday = getBookableSlots(slotDay).slice(0, 4);

      return formatDoctor(doctor, availableSlotsToday);
    })
  );

  return {
    doctors: doctorsWithSlots,
    pagination: {
      page,
      limit,
      totalDoctors,
      totalPages: Math.ceil(totalDoctors / limit),
    },
    filters: {
      search,
      specialtyId,
      minExperience,
      sort,
    },
  };
};

export const getPublicDoctorDetailsService = async (doctorId) => {
  validateObjectId(doctorId, "doctor id");

  const activeSpecialties = await findActiveSpecialties();
  const activeSpecialtyIds = activeSpecialties.map((item) => item._id);

  const doctor = await findPublicDoctorById(doctorId, activeSpecialtyIds);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return formatDoctor(doctor);
};

export const getPublicDoctorAvailableSlotsService = async ({
  doctorId,
  query,
  patientId = null,
}) => {
  validateObjectId(doctorId, "doctor id");

  const date = query.date || getTodayDateString();

  validateDateString(date);
  validateNotPastDate(date);

  const activeSpecialties = await findActiveSpecialties();
  const activeSpecialtyIds = activeSpecialties.map((item) => item._id);

  const doctor = await findPublicDoctorById(doctorId, activeSpecialtyIds);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const slotDay = await ensureSlotDay(doctorId, date);

  const slotDayId = slotDay._id.toString();
  const visibleSlots = getVisibleSlots(slotDay, patientId);
  const bookableSlots = visibleSlots.filter((slot) => slot.isBookable);

  const isUnavailable = slotDay.isHoliday || bookableSlots.length === 0;

  return {
    doctorId,
    slotDayId,
    _id: slotDayId,
    date,
    dayOfWeek: slotDay.dayOfWeek,
    isHoliday: slotDay.isHoliday,
    isUnavailable,
    slots: visibleSlots,
  };
};