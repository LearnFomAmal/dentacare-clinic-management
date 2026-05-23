import Appointment from "../../models/Appointment.js";
import Doctor from "../../models/Doctor.js";
import DoctorSlot from "../../models/DoctorSlot.js";
import Report from "../../models/Report.js";

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
    paymentStatus: "unpaid",
  });
};

export const findPatientReportsByIds = ({ patientId, reportIds }) => {
  return Report.find({
    _id: { $in: reportIds },
    patientId,
  });
};

export const createAppointment = (payload) => {
  return Appointment.create(payload);
};

export const findAppointmentByIdForPatient = ({ appointmentId, patientId }) => {
  return Appointment.findOne({
    _id: appointmentId,
    patientId,
  })
    .populate({
      path: "doctorId",
      select:
        "firstName lastName email specialization professionalInfo stats accountStatus",
    })
    .lean();
};