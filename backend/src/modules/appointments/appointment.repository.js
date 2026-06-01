import Appointment from "../../models/Appointment.js";
import Doctor from "../../models/Doctor.js";
import DoctorSlot from "../../models/DoctorSlot.js";
import Report from "../../models/Report.js";

const appointmentPopulate = [
  {
    path: "patientId",
    select:
      "username email personalInfo profileImage accountStatus referral createdAt",
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

export const findSlotDayForBooking = ({ slotDayId, doctorId }) => {
  return DoctorSlot.findOne({
    _id: slotDayId,
    doctorId,
  });
};

export const findExistingPendingPaymentAppointment = ({
  patientId,
  doctorId,
  appointmentDate,
  slotId,
}) => {
  return Appointment.findOne({
    patientId,
    doctorId,
    appointmentDate,
    slotId,
    status: "pending_payment",
    paymentStatus: {
      $in: ["unpaid", "failed"],
    },
  });
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

export const findPatientAppointments = ({
  patientId,
  status,
}) => {
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

export const findDoctorAppointments = ({
  doctorId,
  status,
}) => {
  const filter = {
    doctorId,
    paymentStatus: "paid",
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

export const findDoctorAppointmentById = ({
  doctorId,
  appointmentId,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    doctorId,
  })
    .populate(appointmentPopulate)
    .lean();
};

export const findAdminAppointments = ({
  status,
}) => {
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

export const saveAppointment = ({
  appointment,
  session = null,
}) => {
  return appointment.save({ session });
};

export const saveSlotDay = ({
  slotDay,
  session = null,
}) => {
  return slotDay.save({ session });
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

