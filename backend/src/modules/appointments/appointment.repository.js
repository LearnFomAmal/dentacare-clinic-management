import Appointment from "../../models/Appointment.js";
import Doctor from "../../models/Doctor.js";
import DoctorSlot from "../../models/DoctorSlot.js";
import Referral from "../../models/Referral.js";
import Report from "../../models/Report.js";
import User from "../../models/User.js";
import Payment from "../../models/Payment.js";
import DoctorEarning from "../../models/DoctorEarning.js";
const appointmentPopulate = [
  {
    path: "patientId",
    select:
      "username email personalInfo profileImage accountStatus referral walletSummary createdAt",
  },
  {
    path: "doctorId",
    select:
      "firstName lastName email specialization professionalInfo stats accountStatus",
  },
];

export const findDoctorForBooking = (doctorId) => {
  return Doctor.findById(doctorId).select(
    "_id firstName lastName email specialization professionalInfo accountStatus stats"
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

export const findAppointmentByIdForPatient = ({ appointmentId, patientId }) => {
  return Appointment.findOne({
    _id: appointmentId,
    patientId,
  })
    .populate(appointmentPopulate)
    .lean();
};

export const findPatientAppointments = ({ patientId, status }) => {
  const filter = {
    patientId,
  };

  if (status) {
    filter.status = status;
  }

  return Appointment.find(filter)
    .populate(appointmentPopulate)
    .sort({
      appointmentDate: -1,
      startTime: -1,
      createdAt: -1,
    })
    .lean();
};

export const findPatientOverlappingAppointments = ({
  patientId,
  appointmentDate,
  startTime,
  endTime,
  excludeDoctorId = null,
  session = null,
}) => {
  const filter = {
    patientId,
    appointmentDate,

    status: {
      $in: ["pending_payment", "pending", "approved"],
    },

    paymentStatus: {
      $in: ["unpaid", "paid"],
    },

    startTime: {
      $lt: endTime,
    },

    endTime: {
      $gt: startTime,
    },
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

export const findDoctorAppointments = ({ doctorId, status }) => {
  const filter = {
    doctorId,
    paymentStatus: {
      $in: ["paid", "refunded"],
    },
  };

  if (status) {
    filter.status = status;
  }

  return Appointment.find(filter)
    .populate(appointmentPopulate)
    .sort({
      appointmentDate: 1,
      startTime: 1,
      createdAt: -1,
    })
    .lean();
};

export const findDoctorAppointmentById = ({ doctorId, appointmentId }) => {
  return Appointment.findOne({
    _id: appointmentId,
    doctorId,
  })
    .populate(appointmentPopulate)
    .lean();
};

export const findAdminAppointments = ({ status }) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  return Appointment.find(filter)
    .populate(appointmentPopulate)
    .sort({
      appointmentDate: -1,
      startTime: -1,
      createdAt: -1,
    })
    .lean();
};

export const findAdminAppointmentById = (appointmentId) => {
  return Appointment.findById(appointmentId)
    .populate(appointmentPopulate)
    .lean();
};

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

export const findSlotDayById = ({ slotDayId, doctorId, session = null }) => {
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
      _id: { $in: reportIds },
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
export const findPatientForCompletion = ({ patientId, session = null }) => {
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

export const markReferralRewardCredited = ({ referralId, session = null }) => {
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

export const findAutoExpirablePendingAppointments = ({ nowDate, nowTime }) => {
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

export const createDoctorEarning = async ({ payload, session = null }) => {
  const earnings = await DoctorEarning.create([payload], { session });

  return earnings[0];
};