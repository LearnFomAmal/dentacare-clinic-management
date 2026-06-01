import Appointment from "../../models/Appointment.js";
import DoctorSlot from "../../models/DoctorSlot.js";
import Payment from "../../models/Payment.js";

export const findPatientAppointmentById = ({
  appointmentId,
  patientId,
  session = null,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    patientId,
  }).session(session);
};

export const findPaymentByTransactionId = ({
  transactionId,
  session = null,
}) => {
  return Payment.findOne({
    transactionId,
  }).session(session);
};

export const createPayment = async ({
  payload,
  session = null,
}) => {
  const payments = await Payment.create([payload], { session });

  return payments[0];
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