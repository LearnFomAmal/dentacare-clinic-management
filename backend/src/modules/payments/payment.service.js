import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import { env } from "../../config/env.js";
import AppError from "../../shared/errors/AppError.js";
import {
  safeCreateAdminNotification,
  safeCreateNotification,
} from "../notifications/notification.service.js";
import {
  countCompletedCouponUsageByUser,
  createCouponUsage,
  createPayment,
  deleteAppointmentById,
  findActiveReferralConfigForPayment,
  findCouponForPayment,
  findPatientAppointmentById,
  findPaymentByRazorpayOrderId,
  findPaymentByTransactionId,
  findReferralForPayment,
  findSlotDayById,
  incrementCouponUsedCountSafely,
  markReferralDiscountUsedForPayment,
  saveAppointment,
  saveSlotDay,
  releaseReportsFromAppointment,
} from "./payment.repository.js";

import { processBookingWalletDebit } from "../wallets/wallet.service.js";

import {
  validateCreateRazorpayOrderInput,
  validatePaymentFailedInput,
  validatePaymentSuccessInput,
  validateVerifyRazorpayPaymentInput,
} from "./payment.validator.js";

const PAYMENT_RESERVATION_EXPIRED_MESSAGE =
  "Payment time expired. Please select the slot again.";

const getRazorpayInstance = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay credentials are not configured", 500);
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

const getAppointmentDoctorId = (appointment) => {
  return appointment.doctorId?.toString();
};

const buildPaymentPayload = ({
  appointment,
  paymentMethod,
  transactionId,
  status,
  failureReason = "",
  razorpayOrderId = "",
  razorpayPaymentId = "",
  razorpaySignature = "",
}) => {
  return {
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,

    consultationFee: appointment.pricing.consultationFee,
    couponDiscount: appointment.pricing.couponDiscount || 0,
    referralDiscount: appointment.pricing.referralDiscount || 0,
    rewardDiscount: appointment.pricing.rewardDiscount || 0,
    totalDiscount: appointment.pricing.totalDiscount || 0,
    finalAmount: appointment.pricing.finalAmount,

    couponId: appointment.pricing.appliedCouponId || null,
    referralId: appointment.pricing.appliedReferralId || null,
    rewardRuleId: appointment.pricing.appliedRewardRuleId || null,

    paymentMethod,
    transactionId: transactionId.trim(),

    razorpay: {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    },

    status,
    failureReason,
  };
};

const notifyAfterSuccessfulPayment = async ({ appointment }) => {
  await safeCreateNotification({
    recipientRole: "patient",
    recipientId: appointment.patientId,
    actorRole: "system",
    type: "payment_success",
    title: "Payment Successful",
    message:
      "Your payment was successful. Your appointment is now waiting for approval.",
    referenceType: "appointment",
    referenceId: appointment._id,
  });

  await safeCreateNotification({
    recipientRole: "doctor",
    recipientId: appointment.doctorId,
    actorRole: "patient",
    actorId: appointment.patientId,
    actorName: "Patient",
    type: "booking_received",
    title: "New Appointment Booking",
    message: "A patient booked an appointment and it is waiting for approval.",
    referenceType: "appointment",
    referenceId: appointment._id,
  });

  await safeCreateAdminNotification({
    actorRole: "patient",
    actorId: appointment.patientId,
    actorName: "Patient",
    type: "booking_received",
    title: "New Appointment Booking",
    message: "A patient completed payment for a new appointment.",
    referenceType: "appointment",
    referenceId: appointment._id,
  });
};


const ensureAppointmentPayable = (appointment) => {
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status !== "pending_payment") {
    throw new AppError("Only pending payment appointments can be paid", 400);
  }

  if (appointment.paymentStatus === "paid") {
    throw new AppError("Appointment already paid", 400);
  }

  if (appointment.paymentStatus === "failed") {
    throw new AppError(
      "This payment attempt failed. Please book the appointment again.",
      400
    );
  }

  if (
    appointment.reservation?.reservedUntil &&
    appointment.reservation.reservedUntil < new Date()
  ) {
    throw new AppError(PAYMENT_RESERVATION_EXPIRED_MESSAGE, 400);
  }
};

const releaseReservedSlot = async ({ appointment, session }) => {
  const slotDay = await findSlotDayById({
    slotDayId: appointment.slotDayId,
    doctorId: getAppointmentDoctorId(appointment),
    session,
  });

  if (!slotDay) {
    return null;
  }

  const slot = slotDay.slots.id(appointment.slotId);

  if (
    slot &&
    slot.status === "reserved" &&
    slot.reservedAppointmentId?.toString() === appointment._id.toString()
  ) {
    slot.status = "available";
    slot.reservedBy = null;
    slot.reservedAppointmentId = null;
    slot.reservedUntil = null;

    await saveSlotDay({
      slotDay,
      session,
    });
  }

  return slotDay;
};

const verifySlotReservation = async ({
  appointment,
  patientId,
  session,
}) => {
  const slotDay = await findSlotDayById({
    slotDayId: appointment.slotDayId,
    doctorId: getAppointmentDoctorId(appointment),
    session,
  });

  if (!slotDay) {
    throw new AppError("Slot day not found", 404);
  }

  if (slotDay.isHoliday) {
    throw new AppError(
      "This slot date is now marked as holiday. Please book another slot.",
      400
    );
  }

  const slot = slotDay.slots.id(appointment.slotId);

  if (!slot || slot.isDeleted) {
    throw new AppError("Selected slot not found", 404);
  }

  if (slot.status !== "reserved") {
    throw new AppError(
      "This slot is no longer reserved. Please book again.",
      400
    );
  }

  if (
    !slot.reservedAppointmentId ||
    slot.reservedAppointmentId.toString() !== appointment._id.toString()
  ) {
    throw new AppError("Slot reservation mismatch", 400);
  }

  if (
    !slot.reservedBy ||
    slot.reservedBy.toString() !== patientId.toString()
  ) {
    throw new AppError("Slot is reserved by another patient", 400);
  }

  if (slot.reservedUntil && slot.reservedUntil < new Date()) {
    slot.status = "available";
    slot.reservedBy = null;
    slot.reservedAppointmentId = null;
    slot.reservedUntil = null;

    appointment.reservation.releasedAt = new Date();

    await saveSlotDay({
      slotDay,
      session,
    });

    await saveAppointment({
      appointment,
      session,
    });

    throw new AppError(PAYMENT_RESERVATION_EXPIRED_MESSAGE, 400);
  }

  return {
    slotDay,
    slot,
  };
};

const applyCouponUsageAfterPayment = async ({
  appointment,
  payment,
  session,
}) => {
  if (
    !appointment.pricing?.appliedCouponId ||
    appointment.pricing?.couponDiscount <= 0
  ) {
    return;
  }

  const coupon = await findCouponForPayment({
    couponId: appointment.pricing.appliedCouponId,
    session,
  });

  if (!coupon) {
    throw new AppError("Applied coupon no longer exists", 400);
  }

  if (!coupon.isActive) {
    throw new AppError("Applied coupon is no longer active", 400);
  }

  const now = new Date();

  if (now > coupon.validTo) {
    throw new AppError("Applied coupon has expired", 400);
  }

  const userUsageCount = await countCompletedCouponUsageByUser({
    userId: appointment.patientId,
    couponId: coupon._id,
    session,
  });

  if (
    Number(coupon.maxUsagePerUser || 0) > 0 &&
    userUsageCount >= coupon.maxUsagePerUser
  ) {
    throw new AppError("Coupon usage limit reached for this user", 400);
  }

  const incrementResult = await incrementCouponUsedCountSafely({
    couponId: coupon._id,
    session,
  });

  if (incrementResult.modifiedCount !== 1) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  await createCouponUsage({
    payload: {
      userId: appointment.patientId,
      couponId: coupon._id,
      appointmentId: appointment._id,
      paymentId: payment._id,
      discountApplied: appointment.pricing.couponDiscount,
      finalAmount: appointment.pricing.finalAmount,
      status: "completed",
      usedAt: new Date(),
    },
    session,
  });
};

const markReferralDiscountAfterPayment = async ({
  appointment,
  session,
}) => {
  if (
    !appointment.pricing?.appliedReferralId ||
    appointment.pricing?.referralDiscount <= 0
  ) {
    return;
  }

  const referral = await findReferralForPayment({
    referralId: appointment.pricing.appliedReferralId,
    referredUserId: appointment.patientId,
    session,
  });

  if (!referral) {
    throw new AppError("Referral discount is no longer available", 400);
  }

  const referralConfig = await findActiveReferralConfigForPayment({
    session,
  });

  if (!referralConfig) {
    throw new AppError("Referral discount is no longer active", 400);
  }

  const updatedReferral = await markReferralDiscountUsedForPayment({
    referralId: referral._id,
    referredUserId: appointment.patientId,
    appointmentId: appointment._id,
    refereeDiscount: appointment.pricing.referralDiscount,
    referrerReward: referralConfig.referrerReward || 0,
    session,
  });

  if (!updatedReferral) {
    throw new AppError("Referral discount was already used", 400);
  }
};

const completeSuccessfulPayment = async ({
  patientId,
  appointmentId,
  paymentMethod,
  transactionId,
  razorpayOrderId = "",
  razorpayPaymentId = "",
  razorpaySignature = "",
}) => {
  const session = await mongoose.startSession();

  try {
    let finalAppointment = null;
    let finalPayment = null;
    let finalWalletTransaction = null;

    await session.withTransaction(async () => {
      const duplicatePayment = await findPaymentByTransactionId({
        transactionId: transactionId.trim(),
        session,
      });

      if (duplicatePayment) {
        throw new AppError("Duplicate transaction id", 400);
      }

      if (razorpayOrderId) {
        const duplicateOrderPayment = await findPaymentByRazorpayOrderId({
          orderId: razorpayOrderId,
          session,
        });

        if (duplicateOrderPayment) {
          throw new AppError("This Razorpay order is already processed", 400);
        }
      }

      const appointment = await findPatientAppointmentById({
        appointmentId,
        patientId,
        session,
      });

      ensureAppointmentPayable(appointment);
       if (razorpayOrderId) {
  const storedOrderId = appointment.paymentSummary?.razorpayOrderId || "";

  if (!storedOrderId) {
    throw new AppError(
      "No Razorpay order was created for this appointment",
      400
    );
  }

  if (storedOrderId !== razorpayOrderId) {
    throw new AppError(
      "Razorpay order does not match this appointment",
      400
    );
  }
}
      const { slotDay, slot } = await verifySlotReservation({
        appointment,
        patientId,
        session,
      });

      if (paymentMethod === "wallet") {
        const walletResult = await processBookingWalletDebit({
          userId: patientId,
          appointment,
          amount: appointment.pricing.finalAmount,
          session,
        });

        finalWalletTransaction = walletResult?.transaction || null;
      }

      const payment = await createPayment({
        payload: buildPaymentPayload({
          appointment,
          paymentMethod,
          transactionId,
          status: "paid",
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
        session,
      });

      await applyCouponUsageAfterPayment({
        appointment,
        payment,
        session,
      });

      await markReferralDiscountAfterPayment({
        appointment,
        session,
      });

      slot.status = "booked";
      slot.reservedBy = null;
      slot.reservedAppointmentId = null;
      slot.reservedUntil = null;

      appointment.status = "pending";
      appointment.paymentStatus = "paid";
      appointment.paymentSummary = {
        paymentId: payment._id,
        paymentMethod,
        transactionId: transactionId.trim(),
        razorpayOrderId,
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
     if (finalAppointment) {
  await notifyAfterSuccessfulPayment({
    appointment: finalAppointment,
  });
}
    return {
      appointment: finalAppointment,
      payment: finalPayment,
      walletTransaction: finalWalletTransaction,
    };
   } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(
        "Payment is already processed for this appointment",
        400
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const createRazorpayOrderService = async ({ patientId, body }) => {
  validateCreateRazorpayOrderInput(body);

  const { appointmentId } = body;

  const appointment = await findPatientAppointmentById({
    appointmentId,
    patientId,
  });

  ensureAppointmentPayable(appointment);

  if (Number(appointment.pricing?.finalAmount || 0) <= 0) {
    throw new AppError("Invalid payment amount", 400);
  }

  const razorpay = getRazorpayInstance();

  const amountInPaise = Math.round(
    Number(appointment.pricing.finalAmount) * 100
  );

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: env.RAZORPAY_CURRENCY || "INR",
    receipt: `appt_${appointment._id.toString()}`,
    notes: {
      appointmentId: appointment._id.toString(),
      patientId: appointment.patientId.toString(),
      doctorId: appointment.doctorId.toString(),
    },
  });

  appointment.paymentSummary = {
  ...appointment.paymentSummary,
  razorpayOrderId: order.id,
};

await saveAppointment({
  appointment,
});

  return {
    keyId: env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    appointmentId: appointment._id,
    name: "DentaCare",
    description: "Dental appointment consultation fee",
  };
};

export const verifyRazorpayPaymentService = async ({
  patientId,
  body,
}) => {
  const {
    appointmentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = validateVerifyRazorpayPaymentInput(body);

  if (!env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay secret is not configured", 500);
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  return completeSuccessfulPayment({
    patientId,
    appointmentId,
    paymentMethod: "razorpay",
    transactionId: razorpayPaymentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
};

export const markPaymentSuccessService = async ({ patientId, body }) => {
  validatePaymentSuccessInput(body);

  const { appointmentId, paymentMethod, transactionId } = body;

  if (paymentMethod !== "wallet") {
    throw new AppError(
      "Online payment must be verified through Razorpay verification",
      400
    );
  }

  return completeSuccessfulPayment({
    patientId,
    appointmentId,
    paymentMethod,
    transactionId,
  });
};

export const markPaymentFailedService = async ({ patientId, body }) => {
  validatePaymentFailedInput(body);

  const { appointmentId } = body;

  const session = await mongoose.startSession();

  try {
    let deletedAppointmentId = null;

    await session.withTransaction(async () => {
      const appointment = await findPatientAppointmentById({
        appointmentId,
        patientId,
        session,
      });

      if (!appointment) {
        return;
      }

      if (appointment.status !== "pending_payment") {
        return;
      }

      if (appointment.paymentStatus === "paid") {
        throw new AppError("Appointment is already paid", 400);
      }

     await releaseReservedSlot({
  appointment,
  session,
});

await releaseReportsFromAppointment({
  appointmentId: appointment._id,
  patientId,
  session,
});

await deleteAppointmentById({
  appointmentId: appointment._id,
  patientId,
  session,
});

      deletedAppointmentId = appointment._id;
    });

    return {
      deletedAppointmentId,
      shouldBookAgain: true,
      message:
        "Payment failed. Temporary appointment was removed. Please book again.",
    };
  } finally {
    await session.endSession();
  }
};