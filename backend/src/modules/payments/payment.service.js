import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

import {
  createPayment,
  findPatientAppointmentById,
  findPaymentByTransactionId,
  findSlotDayById,
  saveAppointment,
  saveSlotDay,
} from "./payment.repository.js";

import {
  validatePaymentFailedInput,
  validatePaymentSuccessInput,
} from "./payment.validator.js";

const getAppointmentDoctorId = (appointment) => {
  return appointment.doctorId?.toString();
};

const buildPaymentPayload = ({
  appointment,
  paymentMethod,
  transactionId,
  status,
  failureReason = "",
}) => {
  return {
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,

    consultationFee: appointment.pricing.consultationFee,
    totalDiscount: appointment.pricing.totalDiscount || 0,
    finalAmount: appointment.pricing.finalAmount,

    paymentMethod,
    transactionId: transactionId.trim(),

    status,
    failureReason,
  };
};

export const markPaymentSuccessService = async ({
  patientId,
  body,
}) => {
  validatePaymentSuccessInput(body);

  const {
    appointmentId,
    paymentMethod,
    transactionId,
  } = body;

  const session = await mongoose.startSession();

  try {
    let finalAppointment = null;
    let finalPayment = null;

    await session.withTransaction(async () => {
      const duplicatePayment = await findPaymentByTransactionId({
        transactionId: transactionId.trim(),
        session,
      });

      if (duplicatePayment) {
        throw new AppError("Duplicate transaction id", 400);
      }

      const appointment = await findPatientAppointmentById({
        appointmentId,
        patientId,
        session,
      });

      if (!appointment) {
        throw new AppError("Appointment not found", 404);
      }

      if (appointment.status !== "pending_payment") {
        throw new AppError(
          "Only pending payment appointments can be paid",
          400
        );
      }

      if (appointment.paymentStatus === "paid") {
        throw new AppError("Appointment already paid", 400);
      }

      const slotDay = await findSlotDayById({
        slotDayId: appointment.slotDayId,
        doctorId: getAppointmentDoctorId(appointment),
        session,
      });

      if (!slotDay) {
        throw new AppError("Slot day not found", 404);
      }

      const slot = slotDay.slots.id(appointment.slotId);

      if (!slot || slot.isDeleted) {
        throw new AppError("Selected slot not found", 404);
      }

      if (slot.status !== "available") {
        throw new AppError(
          "Selected slot is no longer available",
          400
        );
      }

      const payment = await createPayment({
        payload: buildPaymentPayload({
          appointment,
          paymentMethod,
          transactionId,
          status: "paid",
        }),
        session,
      });

      slot.status = "booked";

      appointment.status = "pending";
      appointment.paymentStatus = "paid";
      appointment.paymentSummary = {
        paymentId: payment._id,
        paymentMethod,
        transactionId: transactionId.trim(),
        paidAt: new Date(),
      };

      await saveSlotDay({
        slotDay,
        session,
      });

      await saveAppointment({
        appointment,
        session,
      });

      finalPayment = payment;
      finalAppointment = appointment;
    });

    return {
      appointment: finalAppointment,
      payment: finalPayment,
    };
  } finally {
    await session.endSession();
  }
};

export const markPaymentFailedService = async ({
  patientId,
  body,
}) => {
  validatePaymentFailedInput(body);

  const {
    appointmentId,
    paymentMethod,
    transactionId,
    failureReason,
  } = body;

  const session = await mongoose.startSession();

  try {
    let finalAppointment = null;
    let finalPayment = null;

    await session.withTransaction(async () => {
      const duplicatePayment = await findPaymentByTransactionId({
        transactionId: transactionId.trim(),
        session,
      });

      if (duplicatePayment) {
        throw new AppError("Duplicate transaction id", 400);
      }

      const appointment = await findPatientAppointmentById({
        appointmentId,
        patientId,
        session,
      });

      if (!appointment) {
        throw new AppError("Appointment not found", 404);
      }

      if (appointment.status !== "pending_payment") {
        throw new AppError(
          "Failed payment can only be recorded for pending payment appointment",
          400
        );
      }

      if (appointment.paymentStatus === "paid") {
        throw new AppError("Appointment is already paid", 400);
      }

      const payment = await createPayment({
        payload: buildPaymentPayload({
          appointment,
          paymentMethod,
          transactionId,
          status: "failed",
          failureReason: failureReason.trim(),
        }),
        session,
      });

      appointment.paymentStatus = "failed";

      await saveAppointment({
        appointment,
        session,
      });

      finalPayment = payment;
      finalAppointment = appointment;
    });

    return {
      appointment: finalAppointment,
      payment: finalPayment,
    };
  } finally {
    await session.endSession();
  }
};