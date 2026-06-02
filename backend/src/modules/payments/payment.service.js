import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import { env } from "../../config/env.js";
import AppError from "../../shared/errors/AppError.js";

import {
  countCompletedCouponUsageByUser,
  createCouponUsage,
  createPayment,
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
} from "./payment.repository.js";

import {
  processBookingWalletDebit,
} from "../wallets/wallet.service.js";

import {
  validateCreateRazorpayOrderInput,
  validatePaymentFailedInput,
  validatePaymentSuccessInput,
  validateVerifyRazorpayPaymentInput,
} from "./payment.validator.js";

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

const ensureAppointmentPayable = (appointment) => {
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

  if (
    appointment.reservation?.reservedUntil &&
    appointment.reservation.reservedUntil < new Date()
  ) {
    throw new AppError(
      "Payment time expired. Please select the slot again.",
      400
    );
  }
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

  const slot = slotDay.slots.id(appointment.slotId);

  if (!slot || slot.isDeleted) {
    throw new AppError("Selected slot not found", 404);
  }

  if (slot.status !== "reserved") {
    throw new AppError("Selected slot is not reserved", 400);
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

    throw new AppError(
      "Slot reservation expired. Please book again.",
      400
    );
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

  if (userUsageCount >= coupon.maxUsagePerUser) {
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
    throw new AppError(
      "Referral discount is no longer available",
      400
    );
  }

  const referralConfig = await findActiveReferralConfigForPayment({
    session,
  });

  if (!referralConfig) {
    throw new AppError(
      "Referral discount is no longer active",
      400
    );
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

    return {
      appointment: finalAppointment,
      payment: finalPayment,
      walletTransaction: finalWalletTransaction,
    };
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
  validateVerifyRazorpayPaymentInput(body);

  const {
    appointmentId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = body;

  if (!env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay secret is not configured", 500);
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  return completeSuccessfulPayment({
    patientId,
    appointmentId,
    paymentMethod: "razorpay",
    transactionId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });
};

export const markPaymentSuccessService = async ({ patientId, body }) => {
  validatePaymentSuccessInput(body);

  const { appointmentId, paymentMethod, transactionId } = body;

  return completeSuccessfulPayment({
    patientId,
    appointmentId,
    paymentMethod,
    transactionId,
  });
};

export const markPaymentFailedService = async ({ patientId, body }) => {
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

      const slotDay = await findSlotDayById({
        slotDayId: appointment.slotDayId,
        doctorId: getAppointmentDoctorId(appointment),
        session,
      });

      if (slotDay) {
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
      }

      appointment.paymentStatus = "failed";
      appointment.reservation = {
        reservedUntil: appointment.reservation?.reservedUntil || null,
        releasedAt: new Date(),
      };

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