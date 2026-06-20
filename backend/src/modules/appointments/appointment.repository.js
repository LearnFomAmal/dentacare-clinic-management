import Appointment from "../../models/Appointment.js";
import Doctor from "../../models/Doctor.js";
import DoctorSlot from "../../models/DoctorSlot.js";
import Referral from "../../models/Referral.js";
import Report from "../../models/Report.js";
import User from "../../models/User.js";
import Payment from "../../models/Payment.js";
import DoctorEarning from "../../models/DoctorEarning.js";
import Coupon from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";

const VISIBLE_PAYMENT_STATUSES = ["paid", "refunded"];

const appointmentPopulate = [
  {
    path: "patientId",
    select:
      "username email personalInfo profileImage accountStatus referral walletSummary createdAt",
  },
  {
    path: "doctorId",
    select:
      "firstName lastName email specialization professionalInfo stats accountStatus verification",
  },
];

// ==============================
// BOOKING HELPERS
// ==============================
export const findDoctorForBooking = (doctorId) => {
  return Doctor.findById(doctorId).select(
    "_id firstName lastName email specialization professionalInfo accountStatus verification stats"
  );
};

export const findPatientReportsByIds = ({ patientId, reportIds }) => {
  return Report.find({
    _id: { $in: reportIds },
    patientId,
  });
};

export const createAppointment = async ({ payload, session = null }) => {
  const appointments = await Appointment.create([payload], { session });

  return appointments[0];
};

export const findAppointmentByIdForPatient = ({
  appointmentId,
  patientId,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    patientId,
  })
    .populate(appointmentPopulate)
    .lean();
};

// ==============================
// PATIENT APPOINTMENTS
// ==============================
const buildPatientAppointmentsFilter = ({ patientId, status }) => {
  const filter = {
    patientId,
    paymentStatus: {
      $in: VISIBLE_PAYMENT_STATUSES,
    },
  };

  if (status) {
    filter.status = status;
  } else {
    filter.status = {
      $ne: "pending_payment",
    };
  }

  return filter;
};

export const findPatientAppointments = ({
  patientId,
  status,
  skip = 0,
  limit = 6,
}) => {
  const filter = buildPatientAppointmentsFilter({
    patientId,
    status,
  });

  return Appointment.find(filter)
    .populate(appointmentPopulate)
    .sort({
      appointmentDate: -1,
      startTime: -1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countPatientAppointments = ({ patientId, status }) => {
  const filter = buildPatientAppointmentsFilter({
    patientId,
    status,
  });

  return Appointment.countDocuments(filter);
};

export const getPatientAppointmentStats = async ({ patientId }) => {
  const baseFilter = {
    patientId,
    paymentStatus: {
      $in: VISIBLE_PAYMENT_STATUSES,
    },
    status: {
      $ne: "pending_payment",
    },
  };

  const [
    total,
    pending,
    approved,
    completed,
    cancelled,
    rejected,
    expired,
  ] = await Promise.all([
    Appointment.countDocuments(baseFilter),

    Appointment.countDocuments({
      patientId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "pending",
    }),

    Appointment.countDocuments({
      patientId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "approved",
    }),

    Appointment.countDocuments({
      patientId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "completed",
    }),

    Appointment.countDocuments({
      patientId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "cancelled",
    }),

    Appointment.countDocuments({
      patientId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "rejected",
    }),

    Appointment.countDocuments({
      patientId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "expired",
    }),
  ]);

  return {
    total,
    pending,
    approved,
    completed,
    cancelled,
    rejected,
    expired,
  };
};

export const findPatientOverlappingAppointments = ({
  patientId,
  appointmentDate,
  startTime,
  endTime,
  excludeDoctorId = null,
  session = null,
}) => {
  const now = new Date();

  const filter = {
    patientId,
    appointmentDate,

    startTime: {
      $lt: endTime,
    },

    endTime: {
      $gt: startTime,
    },

    $or: [
      {
        status: "pending_payment",
        paymentStatus: "unpaid",
        "reservation.reservedUntil": {
          $gt: now,
        },
      },
      {
        status: {
          $in: ["pending", "approved"],
        },
        paymentStatus: "paid",
      },
    ],
  };

  if (excludeDoctorId) {
    filter.doctorId = {
      $ne: excludeDoctorId,
    };
  }

  return Appointment.find(filter)
    .populate([
      {
        path: "doctorId",
        select:
          "firstName lastName specialization professionalInfo accountStatus",
      },
    ])
    .sort({
      appointmentDate: 1,
      startTime: 1,
      createdAt: -1,
    })
    .session(session)
    .lean();
};

// ==============================
// DOCTOR APPOINTMENTS
// ==============================
const buildDoctorAppointmentsFilter = ({ doctorId, status }) => {
  const filter = {
    doctorId,
    paymentStatus: {
      $in: VISIBLE_PAYMENT_STATUSES,
    },
  };

  if (status) {
    filter.status = status;
  } else {
    filter.status = {
      $ne: "pending_payment",
    };
  }

  return filter;
};

export const findDoctorAppointments = ({
  doctorId,
  status,
  skip = 0,
  limit = 6,
}) => {
  const filter = buildDoctorAppointmentsFilter({
    doctorId,
    status,
  });

  return Appointment.find(filter)
    .populate(appointmentPopulate)
    .sort({
      createdAt: -1,
      appointmentDate: -1,
      startTime: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countDoctorAppointments = ({ doctorId, status }) => {
  const filter = buildDoctorAppointmentsFilter({
    doctorId,
    status,
  });

  return Appointment.countDocuments(filter);
};

export const getDoctorAppointmentStats = async ({
  doctorId,
  nowDate,
  nowTime,
}) => {
  const baseFilter = {
    doctorId,
    paymentStatus: {
      $in: VISIBLE_PAYMENT_STATUSES,
    },
    status: {
      $ne: "pending_payment",
    },
  };

  const appointmentEndPassedFilter = {
    $or: [
      {
        appointmentDate: {
          $lt: nowDate,
        },
      },
      {
        appointmentDate: nowDate,
        endTime: {
          $lte: nowTime,
        },
      },
    ],
  };

  const appointmentEndNotPassedFilter = {
    $or: [
      {
        appointmentDate: {
          $gt: nowDate,
        },
      },
      {
        appointmentDate: nowDate,
        endTime: {
          $gt: nowTime,
        },
      },
    ],
  };

  const [
    total,
    pending,
    approved,
    awaitingCompletion,
    completed,
    cancelled,
    rejected,
    expired,
  ] = await Promise.all([
    Appointment.countDocuments(baseFilter),

    Appointment.countDocuments({
      doctorId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "pending",
    }),

    Appointment.countDocuments({
      doctorId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "approved",
      ...appointmentEndNotPassedFilter,
    }),

    Appointment.countDocuments({
      doctorId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "approved",
      ...appointmentEndPassedFilter,
    }),

    Appointment.countDocuments({
      doctorId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "completed",
    }),

    Appointment.countDocuments({
      doctorId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "cancelled",
    }),

    Appointment.countDocuments({
      doctorId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "rejected",
    }),

    Appointment.countDocuments({
      doctorId,
      paymentStatus: {
        $in: VISIBLE_PAYMENT_STATUSES,
      },
      status: "expired",
    }),
  ]);

  return {
    total,
    pending,
    approved,
    awaitingCompletion,
    completed,
    cancelled,
    rejected,
    expired,
  };
};

export const findDoctorAppointmentById = ({ doctorId, appointmentId }) => {
  return Appointment.findOne({
    _id: appointmentId,
    doctorId,
  })
    .populate(appointmentPopulate)
    .lean();
};

// ==============================
// ADMIN APPOINTMENTS
// ==============================
const buildAdminAppointmentsFilter = ({ status, doctorId }) => {
  const filter = {
    paymentStatus: {
      $in: VISIBLE_PAYMENT_STATUSES,
    },
  };

  if (status) {
    filter.status = status;
  } else {
    filter.status = {
      $ne: "pending_payment",
    };
  }

  if (doctorId) {
    filter.doctorId = doctorId;
  }

  return filter;
};

export const findAdminAppointments = ({
  status,
  doctorId,
  skip = 0,
  limit = 6,
}) => {
  const filter = buildAdminAppointmentsFilter({
    status,
    doctorId,
  });

  return Appointment.find(filter)
    .populate(appointmentPopulate)
    .sort({
      createdAt: -1,
      appointmentDate: -1,
      startTime: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAdminAppointments = ({ status, doctorId }) => {
  const filter = buildAdminAppointmentsFilter({
    status,
    doctorId,
  });

  return Appointment.countDocuments(filter);
};

export const getAdminAppointmentStats = async ({ doctorId = "" }) => {
  const baseFilter = {
    paymentStatus: {
      $in: VISIBLE_PAYMENT_STATUSES,
    },
    status: {
      $ne: "pending_payment",
    },
  };

  if (doctorId) {
    baseFilter.doctorId = doctorId;
  }

  const [
    total,
    pending,
    approved,
    completed,
    cancelled,
    rejected,
    expired,
  ] = await Promise.all([
    Appointment.countDocuments(baseFilter),

    Appointment.countDocuments({
      ...baseFilter,
      status: "pending",
    }),

    Appointment.countDocuments({
      ...baseFilter,
      status: "approved",
    }),

    Appointment.countDocuments({
      ...baseFilter,
      status: "completed",
    }),

    Appointment.countDocuments({
      ...baseFilter,
      status: "cancelled",
    }),

    Appointment.countDocuments({
      ...baseFilter,
      status: "rejected",
    }),

    Appointment.countDocuments({
      ...baseFilter,
      status: "expired",
    }),
  ]);

  return {
    total,
    pending,
    approved,
    completed,
    cancelled,
    rejected,
    expired,
  };
};

export const findAdminAppointmentById = (appointmentId) => {
  return Appointment.findById(appointmentId)
    .populate(appointmentPopulate)
    .lean();
};

// ==============================
// ACTION QUERIES
// ==============================
export const findAppointmentForPatientAction = ({
  patientId,
  appointmentId,
  session = null,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    patientId,
  }).session(session);
};

export const findAppointmentForDoctorAction = ({
  doctorId,
  appointmentId,
  session = null,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    doctorId,
  }).session(session);
};

export const findAppointmentForAdminAction = ({
  appointmentId,
  session = null,
}) => {
  return Appointment.findById(appointmentId).session(session);
};

// ==============================
// SLOT HELPERS
// ==============================
export const findSlotDayById = ({
  slotDayId,
  doctorId,
  session = null,
}) => {
  return DoctorSlot.findOne({
    _id: slotDayId,
    doctorId,
  }).session(session);
};

export const findSlotDayForBookingWithSession = ({
  slotDayId,
  doctorId,
  session = null,
}) => {
  return DoctorSlot.findOne({
    _id: slotDayId,
    doctorId,
  }).session(session);
};

export const saveAppointment = ({ appointment, session = null }) => {
  return appointment.save({ session });
};

export const saveSlotDay = ({ slotDay, session = null }) => {
  return slotDay.save({ session });
};

export const updateReportsAsAttached = ({
  reportIds,
  appointmentId,
  doctorId,
  session = null,
}) => {
  return Report.updateMany(
    {
      _id: {
        $in: reportIds,
      },
    },
    {
      appointmentId,
      doctorId,
      status: "attached",
    }
  ).session(session);
};

// ==============================
// COMPLETION HELPERS
// ==============================
export const findPatientForCompletion = ({
  patientId,
  session = null,
}) => {
  return User.findById(patientId)
    .select("_id username email referral accountStatus walletSummary")
    .session(session);
};

export const markPatientFirstAppointmentCompleted = ({
  patientId,
  session = null,
}) => {
  return User.updateOne(
    {
      _id: patientId,
      "referral.hasCompletedFirstAppointment": false,
    },
    {
      "referral.hasCompletedFirstAppointment": true,
    }
  ).session(session);
};

export const claimReferralRewardForCompletion = ({
  referredUserId,
  completedAppointmentId,
  session = null,
}) => {
  return Referral.findOneAndUpdate(
    {
      referredUserId,
      status: "discount_used",
      rewardStatus: {
        $ne: "credited",
      },
    },
    {
      status: "completed",
      rewardStatus: "pending_wallet_credit",
      firstCompletedAppointmentId: completedAppointmentId,
      completedAt: new Date(),
    },
    {
      new: true,
      session,
    }
  );
};

export const markReferralRewardCredited = ({
  referralId,
  session = null,
}) => {
  return Referral.findOneAndUpdate(
    {
      _id: referralId,
      rewardStatus: "pending_wallet_credit",
    },
    {
      rewardStatus: "credited",
      rewardedAt: new Date(),
    },
    {
      new: true,
      session,
    }
  );
};

export const findAutoExpirablePendingAppointments = ({
  nowDate,
  nowTime,
}) => {
  return Appointment.find({
    status: "pending",
    paymentStatus: "paid",
    $or: [
      {
        appointmentDate: {
          $lt: nowDate,
        },
      },
      {
        appointmentDate: nowDate,
        endTime: {
          $lte: nowTime,
        },
      },
    ],
  });
};

export const findPendingPaymentAppointmentForReservedSlot = ({
  appointmentId,
  patientId,
  doctorId,
  slotDayId,
  slotId,
  session = null,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    patientId,
    doctorId,
    slotDayId,
    slotId,
    status: "pending_payment",
    paymentStatus: "unpaid",
    "reservation.reservedUntil": {
      $gt: new Date(),
    },
  }).session(session);
};

export const findPaidPaymentForAppointment = ({
  appointmentId,
  session = null,
}) => {
  return Payment.findOne({
    appointmentId,
    status: "paid",
  }).session(session);
};

export const findDoctorEarningByAppointmentId = ({
  appointmentId,
  session = null,
}) => {
  return DoctorEarning.findOne({
    appointmentId,
  }).session(session);
};

export const createDoctorEarning = async ({
  payload,
  session = null,
}) => {
  const earnings = await DoctorEarning.create([payload], {
    session,
  });

  return earnings[0];
};

// ==============================
// COUPON RELEASE HELPER
// ==============================
export const releaseCompletedCouponUsageForAppointment = async ({
  appointmentId,
  reason = "",
  session = null,
}) => {
  const couponUsage = await CouponUsage.findOneAndUpdate(
    {
      appointmentId,
      status: "completed",
    },
    {
      status: "cancelled",
      releasedAt: new Date(),
      releaseReason: reason,
    },
    {
      new: true,
      session,
    }
  );

  if (!couponUsage) {
    return null;
  }

  await Coupon.updateOne(
    {
      _id: couponUsage.couponId,
      usedCount: {
        $gt: 0,
      },
    },
    {
      $inc: {
        usedCount: -1,
      },
    }
  ).session(session);

  return couponUsage;
};
