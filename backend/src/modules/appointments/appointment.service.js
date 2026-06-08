import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";
import { findUserById } from "../users/user.repository.js";
import {
  creditReferralRewardToWallet,
  refundAppointmentPaymentToWallet,
} from "../wallets/wallet.service.js";
import { validateCouponForAppointment } from "../coupons/coupon.service.js";
import {
  claimReferralRewardForCompletion,
  createAppointment,
  createDoctorEarning,
  findAdminAppointmentById,
  findAdminAppointments,
  findAppointmentByIdForPatient,
  findAppointmentForAdminAction,
  findAppointmentForDoctorAction,
  findAppointmentForPatientAction,
  findDoctorAppointmentById,
  findDoctorAppointments,
  findDoctorEarningByAppointmentId,
  findDoctorForBooking,
  findPaidPaymentForAppointment,
  findPatientAppointments,
  findPatientForCompletion,
  findPatientReportsByIds,
  findSlotDayById,
  findSlotDayForBookingWithSession,
  markPatientFirstAppointmentCompleted,
  markReferralRewardCredited,
  saveAppointment,
  saveSlotDay,
  updateReportsAsAttached,
  findAutoExpirablePendingAppointments,
  findPendingPaymentAppointmentForReservedSlot,
  findPatientOverlappingAppointments,
} from "./appointment.repository.js";

import { getReferralDiscountForAppointment } from "../referrals/referral.service.js";
import {
  validateAppointmentStatusFilter,
  validateCancelAppointmentInput,
  validateInitiateAppointmentInput,
  validateObjectId,
  validateRejectAppointmentInput,
  validateRescheduleAppointmentInput,
} from "./appointment.validator.js";

const RESERVATION_MINUTES = 10;
const MIN_BOOKING_LEAD_MINUTES = 120;
const CANCELLATION_REFUND_CUTOFF_HOURS = 4;

const isPatientProfileComplete = (user) => {
  return Boolean(
    user?.username &&
      user?.email &&
      user?.personalInfo?.dateOfBirth &&
      user?.personalInfo?.gender &&
      user?.personalInfo?.phoneNumber &&
      user?.personalInfo?.bloodGroup
  );
};

const getReportFileUrl = (report) => {
  return report?.file?.url || report?.fileUrl || report?.url || "";
};

const normalizeAppointmentReport = (report) => {
  return {
    reportId: report._id,
    title: report.title || "",
    reportType: report.reportType || "other",
    fileUrl: getReportFileUrl(report),
  };
};
const createDoctorEarningAfterCompletion = async ({
  appointment,
  session,
}) => {
  const existingEarning = await findDoctorEarningByAppointmentId({
    appointmentId: appointment._id,
    session,
  });

  if (existingEarning) {
    return existingEarning;
  }

  const payment = await findPaidPaymentForAppointment({
    appointmentId: appointment._id,
    session,
  });

  if (!payment) {
    throw new AppError(
      "Paid payment record not found for this appointment",
      404
    );
  }

  const earnedAmount = Number(appointment.pricing?.finalAmount || 0);

  if (earnedAmount <= 0) {
    throw new AppError(
      "Invalid earning amount for this appointment",
      400
    );
  }

  return createDoctorEarning({
    payload: {
      doctorId: appointment.doctorId,
      appointmentId: appointment._id,
      paymentId: payment._id,
      patientId: appointment.patientId,

      consultationFee: Number(appointment.pricing?.consultationFee || 0),
      couponDiscount: Number(appointment.pricing?.couponDiscount || 0),
      referralDiscount: Number(appointment.pricing?.referralDiscount || 0),
      rewardDiscount: Number(appointment.pricing?.rewardDiscount || 0),
      totalDiscount: Number(appointment.pricing?.totalDiscount || 0),

      finalAmount: earnedAmount,
      earnedAmount,

      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,

      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,

      earningStatus: "earned",
      earnedAt: new Date(),
    },
    session,
  });
};
const ensurePendingAppointmentForDecision = (appointment) => {
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status === "expired") {
    throw new AppError("Expired appointment cannot be approved or rejected", 400);
  }

  if (appointment.status !== "pending") {
    throw new AppError(
      "Only pending appointments can be approved or rejected",
      400
    );
  }

  if (appointment.paymentStatus !== "paid") {
    throw new AppError(
      "Only paid appointments can be approved or rejected",
      400
    );
  }

  ensureAppointmentTimeNotOver(appointment);
};

const ensureAppointmentCanBeCompleted = (appointment) => {
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status === "completed") {
    throw new AppError("Appointment is already completed", 400);
  }

  if (appointment.status === "expired") {
    throw new AppError("Expired appointment cannot be completed", 400);
  }

  if (appointment.status === "cancelled") {
    throw new AppError("Cancelled appointment cannot be completed", 400);
  }

  if (appointment.status === "rejected") {
    throw new AppError("Rejected appointment cannot be completed", 400);
  }

  if (appointment.status !== "approved") {
    throw new AppError(
      "Only approved appointments can be marked as completed",
      400
    );
  }

  if (appointment.paymentStatus !== "paid") {
    throw new AppError(
      "Only paid appointments can be marked as completed",
      400
    );
  }

  if (!isAppointmentEndTimePast(appointment)) {
    throw new AppError(
      "Appointment can be completed only after the consultation end time",
      400
    );
  }
};

const ensureAppointmentCanBeCancelled = ({ appointment, cancelledBy }) => {
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

   if (appointment.status === "expired") {
  throw new AppError("Expired appointment cannot be cancelled", 400);
}

ensureAppointmentTimeNotOver(appointment);

  if (appointment.status === "cancelled") {
    throw new AppError("Appointment is already cancelled", 400);
  }

  if (appointment.status === "completed") {
    throw new AppError("Completed appointment cannot be cancelled", 400);
  }

  if (appointment.status === "rejected") {
    throw new AppError("Rejected appointment cannot be cancelled", 400);
  }

  if (appointment.status === "pending_payment") {
    throw new AppError(
      "Payment pending appointment cannot be cancelled from here",
      400
    );
  }

  if (
    cancelledBy === "patient" &&
    !["pending", "approved"].includes(appointment.status)
  ) {
    throw new AppError(
      "Patient can cancel only pending or approved appointments",
      400
    );
  }

  if (
    cancelledBy === "admin" &&
    !["pending", "approved"].includes(appointment.status)
  ) {
    throw new AppError(
      "Admin can cancel only pending or approved appointments",
      400
    );
  }

  if (cancelledBy === "doctor") {
    throw new AppError("Doctor cancellation is not allowed", 403);
  }
};

const releaseAppointmentSlot = async ({ appointment, session }) => {
  const slotDay = await findSlotDayById({
    slotDayId: appointment.slotDayId,
    doctorId: appointment.doctorId,
    session,
  });

  if (!slotDay) return;

  const slot = slotDay.slots.id(appointment.slotId);

  if (!slot || slot.isDeleted) return;

  if (["reserved", "booked", "blocked"].includes(slot.status)) {
    slot.status = "available";
    slot.reservedBy = null;
    slot.reservedAppointmentId = null;
    slot.reservedUntil = null;

    await saveSlotDay({
      slotDay,
      session,
    });
  }
};

const getReservationExpiry = () => {
  return new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
};

const clearExpiredReservationsInSlotDay = async ({ slotDay, session }) => {
  const now = new Date();
  let changed = false;

  slotDay.slots.forEach((slot) => {
    if (
      slot.status === "reserved" &&
      slot.reservedUntil &&
      slot.reservedUntil < now
    ) {
      slot.status = "available";
      slot.reservedBy = null;
      slot.reservedAppointmentId = null;
      slot.reservedUntil = null;
      changed = true;
    }
  });

  if (changed) {
    await saveSlotDay({
      slotDay,
      session,
    });
  }
};

const cancelAppointmentCore = async ({
  appointment,
  cancelledBy,
  body,
  session,
}) => {
  validateCancelAppointmentInput(body);

  ensureAppointmentCanBeCancelled({
    appointment,
    cancelledBy,
  });

  const refundDecision = getCancellationRefundDecision({
    appointment,
    cancelledBy,
  });

  appointment.status = "cancelled";

  appointment.cancellation = {
    cancelledBy,
    reasonType: body.reasonType,
    reason: body.reason.trim(),
    cancelledAt: new Date(),

    refundEligible: refundDecision.refundEligible,
    refundStatus: refundDecision.refundStatus,
    refundPolicy: refundDecision.refundPolicy,
  };

  appointment.approval = {
    approvedBy: "",
    approvedAt: null,
  };

  await releaseAppointmentSlot({
    appointment,
    session,
  });

  if (appointment.paymentStatus === "paid" && refundDecision.refundEligible) {
    appointment.paymentStatus = "refunded";
    appointment.cancellation.refundStatus = "refunded";

    await refundAppointmentPaymentToWallet({
      appointment,
      reason: `Appointment cancelled by ${cancelledBy}. Refund credited to wallet.`,
      session,
    });
  }

  if (appointment.paymentStatus === "paid" && !refundDecision.refundEligible) {
    appointment.cancellation.refundStatus = "not_refunded";
  }

  await saveAppointment({
    appointment,
    session,
  });

  return appointment;
};

const getLocalDateAndTime = () => {
  const now = new Date();

  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  return {
    now,
    localDate,
    localTime,
  };
};

const buildAppointmentDateTime = ({ appointmentDate, time }) => {
  return new Date(`${appointmentDate}T${time}:00+05:30`);
};

const buildAppointmentStartDateTime = (appointment) => {
  if (!appointment?.appointmentDate || !appointment?.startTime) {
    return null;
  }

  const appointmentStart = buildAppointmentDateTime({
    appointmentDate: appointment.appointmentDate,
    time: appointment.startTime,
  });

  if (Number.isNaN(appointmentStart.getTime())) {
    return null;
  }

  return appointmentStart;
};

const getCancellationRefundDecision = ({ appointment, cancelledBy }) => {
  if (appointment.paymentStatus !== "paid") {
    return {
      refundEligible: false,
      refundStatus: "not_applicable",
      refundPolicy: "No paid payment found for refund.",
    };
  }

  // Admin-side cancellation should refund the patient.
  if (cancelledBy === "admin") {
    return {
      refundEligible: true,
      refundStatus: "eligible",
      refundPolicy:
        "Refund eligible because the appointment was cancelled by admin.",
    };
  }

  const appointmentStart = buildAppointmentStartDateTime(appointment);

  if (!appointmentStart) {
    return {
      refundEligible: false,
      refundStatus: "not_eligible",
      refundPolicy: "Refund not eligible because appointment time is invalid.",
    };
  }

  const now = new Date();

  const refundCutoffTime = new Date(
    appointmentStart.getTime() -
      CANCELLATION_REFUND_CUTOFF_HOURS * 60 * 60 * 1000
  );

  if (now <= refundCutoffTime) {
    return {
      refundEligible: true,
      refundStatus: "eligible",
      refundPolicy: `Refund eligible because cancellation was made at least ${CANCELLATION_REFUND_CUTOFF_HOURS} hours before the appointment.`,
    };
  }

  return {
    refundEligible: false,
    refundStatus: "not_eligible",
    refundPolicy: `No refund because cancellation was made within ${CANCELLATION_REFUND_CUTOFF_HOURS} hours of the appointment.`,
  };
};

const isAppointmentEndTimePast = (appointment) => {
  if (!appointment?.appointmentDate || !appointment?.endTime) {
    return false;
  }

  const appointmentEnd = buildAppointmentDateTime({
    appointmentDate: appointment.appointmentDate,
    time: appointment.endTime,
  });

  return appointmentEnd <= new Date();
};

const ensureAppointmentTimeNotOver = (appointment) => {
  if (isAppointmentEndTimePast(appointment)) {
    throw new AppError(
      "Appointment time is already over. This appointment cannot be approved, rejected, cancelled, or rescheduled.",
      400
    );
  }
};

const ensureSlotHasEnoughLeadTime = ({ appointmentDate, startTime }) => {
  const slotStart = buildAppointmentDateTime({
    appointmentDate,
    time: startTime,
  });

  const now = new Date();

  const minAllowedStart = new Date(
    now.getTime() + MIN_BOOKING_LEAD_MINUTES * 60 * 1000
  );

  if (slotStart <= now) {
    throw new AppError(
      "This slot has already passed. Please choose another slot.",
      400
    );
  }

  if (slotStart < minAllowedStart) {
    throw new AppError(
      `Please choose a slot at least ${
        MIN_BOOKING_LEAD_MINUTES / 60
      } hours from now.`,
      400
    );
  }
};

const expirePendingAppointmentCore = async ({ appointment, session }) => {
  if (!appointment) return null;

  if (appointment.status !== "pending") return appointment;

  if (appointment.paymentStatus !== "paid") return appointment;

  if (!isAppointmentEndTimePast(appointment)) return appointment;

  appointment.status = "expired";
  appointment.expiredAt = new Date();

  appointment.approval = {
    approvedBy: "",
    approvedAt: null,
  };

  appointment.rejection = {
    rejectedBy: "",
    reasonType: "appointment_expired",
    reason:
      "Appointment expired because the scheduled time passed without approval.",
    rejectedAt: null,
  };

  await releaseAppointmentSlot({
    appointment,
    session,
  });

  appointment.paymentStatus = "refunded";

  await refundAppointmentPaymentToWallet({
    appointment,
    reason:
      "Appointment expired because the scheduled time passed without approval. Refund credited to wallet.",
    session,
  });

  await saveAppointment({
    appointment,
    session,
  });

  return appointment;
};

const completeAppointmentCore = async ({ appointment, session }) => {
  if (!appointment) {
    return null;
  }

  if (appointment.status === "completed") {
    return appointment;
  }

  if (appointment.status !== "approved") {
    return appointment;
  }

  if (appointment.paymentStatus !== "paid") {
    return appointment;
  }

  appointment.status = "completed";
  appointment.completedAt = new Date();

  await saveAppointment({
    appointment,
    session,
  });

  await createDoctorEarningAfterCompletion({
    appointment,
    session,
  });

  const patient = await findPatientForCompletion({
    patientId: appointment.patientId,
    session,
  });

  if (!patient || patient.accountStatus?.isDeleted) {
    throw new AppError("Patient not found", 404);
  }

  if (!patient.referral?.hasCompletedFirstAppointment) {
    const firstCompletionResult =
      await markPatientFirstAppointmentCompleted({
        patientId: patient._id,
        session,
      });

    const isFirstCompletedAppointment =
      firstCompletionResult.modifiedCount === 1;

    if (isFirstCompletedAppointment) {
      const claimedReferral = await claimReferralRewardForCompletion({
        referredUserId: patient._id,
        completedAppointmentId: appointment._id,
        session,
      });

      if (claimedReferral) {
        await creditReferralRewardToWallet({
          userId: claimedReferral.referrerId,
          referralId: claimedReferral._id,
          amount: claimedReferral.referrerReward,
          session,
        });

        await markReferralRewardCredited({
          referralId: claimedReferral._id,
          session,
        });
      }
    }
  }

  return appointment;
};

const autoExpirePastPendingAppointments = async () => {
  const { localDate, localTime } = getLocalDateAndTime();

  const appointments = await findAutoExpirablePendingAppointments({
    nowDate: localDate,
    nowTime: localTime,
  });

  if (!appointments.length) return;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const appointment of appointments) {
        await expirePendingAppointmentCore({
          appointment,
          session,
        });
      }
    });
  } finally {
    await session.endSession();
  }
};

const syncPastAppointmentStates = async () => {
  await autoExpirePastPendingAppointments();
};

const normalizeTimeConflictAppointment = (appointment) => {
  const doctor = appointment?.doctorId;

  return {
    _id: appointment._id,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    paymentStatus: appointment.paymentStatus,

    doctor: doctor
      ? {
          _id: doctor._id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialization: doctor.specialization,
          profileImage: doctor.professionalInfo?.profileImage || "",
        }
      : null,
  };
};

export const initiateAppointmentService = async ({ patientId, body }) => {
  validateObjectId(patientId, "patient id");
  validateInitiateAppointmentInput(body);

  const patient = await findUserById(patientId);

  if (!patient || patient.accountStatus?.isDeleted) {
    throw new AppError("Patient not found", 404);
  }

  if (!isPatientProfileComplete(patient)) {
    throw new AppError(
      "Please complete your profile before booking an appointment",
      400
    );
  }
const {
  doctorId,
  slotDayId,
  slotId,
  appointmentDate,
  reason,
  reportIds = [],
  couponCode = "",
  allowTimeConflict = false,
} = body;

  const doctor = await findDoctorForBooking(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (doctor.accountStatus?.isDeleted) {
    throw new AppError("Doctor account is deleted", 400);
  }

  if (doctor.accountStatus?.isBlocked) {
    throw new AppError("Doctor is currently unavailable", 400);
  }

  if (!doctor.accountStatus?.isVerified) {
    throw new AppError("Doctor is not verified", 400);
  }

  let appointmentReports = [];

  if (reportIds.length > 0) {
    const reports = await findPatientReportsByIds({
      patientId,
      reportIds,
    });

    if (reports.length !== reportIds.length) {
      throw new AppError("One or more selected reports are invalid", 400);
    }

    appointmentReports = reports.map(normalizeAppointmentReport);
  }

  const consultationFee = doctor.professionalInfo?.consultationFee || 0;

  let couponDiscount = 0;
  let appliedCouponId = null;
  let appliedCouponCode = "";

  if (couponCode && couponCode.trim()) {
    const couponResult = await validateCouponForAppointment({
      userId: patientId,
      doctorId,
      couponCode,
      appointmentAmount: consultationFee,
    });

    couponDiscount = couponResult.discount;
    appliedCouponId = couponResult.coupon._id;
    appliedCouponCode = couponResult.coupon.code;
  }

  const referralResult = await getReferralDiscountForAppointment({
    patient,
    appointmentAmount: consultationFee,
  });

  const referralDiscount = referralResult.referralDiscount;
  const appliedReferralId = referralResult.appliedReferralId;

  const rewardDiscount = 0;
  const totalDiscount = couponDiscount + referralDiscount + rewardDiscount;
  const finalAmount = Math.max(consultationFee - totalDiscount, 0);
  const reservedUntil = getReservationExpiry();

  const session = await mongoose.startSession();

  try {
    let finalAppointment = null;

    await session.withTransaction(async () => {
      const slotDay = await findSlotDayForBookingWithSession({
        slotDayId,
        doctorId,
        session,
      });

      if (!slotDay) {
        throw new AppError("Slot day not found", 404);
      }

      await clearExpiredReservationsInSlotDay({
        slotDay,
        session,
      });

      if (slotDay.date !== appointmentDate) {
        throw new AppError(
          "Selected slot date does not match appointment date",
          400
        );
      }

      if (slotDay.isHoliday) {
        throw new AppError("Cannot book appointment on holiday", 400);
      }

      const selectedSlot = slotDay.slots.id(slotId);

      if (!selectedSlot || selectedSlot.isDeleted) {
        throw new AppError("Selected slot not found", 404);
      }

      if (selectedSlot.status === "reserved") {
  const isReservedBySamePatient =
    selectedSlot.reservedBy &&
    selectedSlot.reservedBy.toString() === patientId.toString();

  const hasValidReservedAppointment =
    selectedSlot.reservedAppointmentId &&
    selectedSlot.reservedUntil &&
    selectedSlot.reservedUntil > new Date();

  if (!isReservedBySamePatient || !hasValidReservedAppointment) {
    throw new AppError("Selected slot is reserved by another patient", 400);
  }

  const existingAppointment =
    await findPendingPaymentAppointmentForReservedSlot({
      appointmentId: selectedSlot.reservedAppointmentId,
      patientId,
      doctorId,
      slotDayId,
      slotId,
      session,
    });

  if (!existingAppointment) {
    selectedSlot.status = "available";
    selectedSlot.reservedBy = null;
    selectedSlot.reservedAppointmentId = null;
    selectedSlot.reservedUntil = null;

    await saveSlotDay({
      slotDay,
      session,
    });

    throw new AppError(
      "Previous reservation was invalid. Please select this slot again.",
      400
    );
  }

  finalAppointment = existingAppointment;
  return;
}

if (selectedSlot.status !== "available") {
  throw new AppError("Selected slot is not available", 400);
}
      
ensureSlotHasEnoughLeadTime({
  appointmentDate,
  startTime: selectedSlot.startTime,
});

if (!allowTimeConflict) {
  const overlappingAppointments =
    await findPatientOverlappingAppointments({
      patientId,
      appointmentDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      excludeDoctorId: new mongoose.Types.ObjectId(doctorId),
      session,
    });

  if (overlappingAppointments.length > 0) {
    finalAppointment = {
      requiresTimeConflictConfirmation: true,
      message:
        "You already have another appointment at this time. Do you want to proceed?",
      conflictAppointment: normalizeTimeConflictAppointment(
        overlappingAppointments[0]
      ),
      requestedSlot: {
        doctorId,
        slotDayId,
        slotId,
        appointmentDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      },
    };

    return;
  }
}

const appointment = await createAppointment({
        payload: {
          patientId: new mongoose.Types.ObjectId(patientId),
          doctorId: new mongoose.Types.ObjectId(doctorId),
          slotDayId: new mongoose.Types.ObjectId(slotDayId),
          slotId: new mongoose.Types.ObjectId(slotId),

          appointmentDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,

          reason: reason.trim(),
          reports: appointmentReports,

          status: "pending_payment",
          paymentStatus: "unpaid",

          pricing: {
            consultationFee,
            couponDiscount,
            referralDiscount,
            rewardDiscount,
            totalDiscount,
            finalAmount,
            appliedCouponId,
            appliedCouponCode,
            appliedReferralId,
            appliedRewardRuleId: null,
          },

          reservation: {
            reservedUntil,
            releasedAt: null,
          },
        },
        session,
      });

      selectedSlot.status = "reserved";
      selectedSlot.reservedBy = new mongoose.Types.ObjectId(patientId);
      selectedSlot.reservedAppointmentId = appointment._id;
      selectedSlot.reservedUntil = reservedUntil;

      await saveSlotDay({
        slotDay,
        session,
      });

      if (reportIds.length > 0) {
        await updateReportsAsAttached({
          reportIds,
          appointmentId: appointment._id,
          doctorId,
          session,
        });
      }

      finalAppointment = appointment;
    });

    return finalAppointment;
  } finally {
    await session.endSession();
  }
};

export const getPatientAppointmentDetailsService = async ({
  patientId,
  appointmentId,
}) => {
  validateObjectId(patientId, "patient id");
  validateObjectId(appointmentId, "appointment id");

  await syncPastAppointmentStates();

  const appointment = await findAppointmentByIdForPatient({
    patientId,
    appointmentId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return appointment;
};


export const getMyAppointmentsService = async ({ patientId, query }) => {
  validateObjectId(patientId, "patient id");

  const { status } = query;

  validateAppointmentStatusFilter(status);

  await syncPastAppointmentStates();

  return findPatientAppointments({
    patientId,
    status,
  });
};

export const cancelAppointmentByPatientService = async ({
  patientId,
  appointmentId,
  body,
}) => {
  validateObjectId(patientId, "patient id");
  validateObjectId(appointmentId, "appointment id");
  await syncPastAppointmentStates();
  const session = await mongoose.startSession();

  try {
    let updatedAppointment = null;

    await session.withTransaction(async () => {
      const appointment = await findAppointmentForPatientAction({
        patientId,
        appointmentId,
        session,
      });

      updatedAppointment = await cancelAppointmentCore({
        appointment,
        cancelledBy: "patient",
        body,
        session,
      });
    });

    return updatedAppointment;
  } finally {
    await session.endSession();
  }
};

export const getDoctorAppointmentsService = async ({ doctorId, query }) => {
  validateObjectId(doctorId, "doctor id");

  const { status } = query;

  validateAppointmentStatusFilter(status);

  await syncPastAppointmentStates();

  return findDoctorAppointments({
    doctorId,
    status,
  });
};

export const getDoctorAppointmentDetailsService = async ({
  doctorId,
  appointmentId,
}) => {
  validateObjectId(doctorId, "doctor id");
  validateObjectId(appointmentId, "appointment id");

  await syncPastAppointmentStates();

  const appointment = await findDoctorAppointmentById({
    doctorId,
    appointmentId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return appointment;
};

export const approveAppointmentByDoctorService = async ({
  doctorId,
  appointmentId,
}) => { 
  validateObjectId(doctorId, "doctor id");
  validateObjectId(appointmentId, "appointment id");
   await syncPastAppointmentStates();
  const appointment = await findAppointmentForDoctorAction({
    doctorId,
    appointmentId,
  });

  ensurePendingAppointmentForDecision(appointment);

  appointment.status = "approved";
  appointment.approval = {
    approvedBy: "doctor",
    approvedAt: new Date(),
  };

  appointment.rejection = {
    rejectedBy: "",
    reasonType: "",
    reason: "",
    rejectedAt: null,
  };

  await saveAppointment({
    appointment,
  });

  return appointment;
};

export const rejectAppointmentByDoctorService = async ({
  doctorId,
  appointmentId,
  body,
}) => {
  validateObjectId(doctorId, "doctor id");
  validateObjectId(appointmentId, "appointment id");
  validateRejectAppointmentInput(body);
    await syncPastAppointmentStates()
  const session = await mongoose.startSession();

  try {
    let updatedAppointment = null;

    await session.withTransaction(async () => {
      const appointment = await findAppointmentForDoctorAction({
        doctorId,
        appointmentId,
        session,
      });

      ensurePendingAppointmentForDecision(appointment);

      appointment.status = "rejected";
      appointment.paymentStatus = "refunded";

      appointment.rejection = {
        rejectedBy: "doctor",
        reasonType: body.reasonType,
        reason: body.reason.trim(),
        rejectedAt: new Date(),
      };

      appointment.approval = {
        approvedBy: "",
        approvedAt: null,
      };

      await releaseAppointmentSlot({
        appointment,
        session,
      });

      await refundAppointmentPaymentToWallet({
        appointment,
        reason: "Appointment rejected by doctor. Refund credited to wallet.",
        session,
      });

      await saveAppointment({
        appointment,
        session,
      });

      updatedAppointment = appointment;
    });

    return updatedAppointment;
  } finally {
    await session.endSession();
  }
};

export const completeAppointmentByDoctorService = async ({
  doctorId,
  appointmentId,
}) => {
  validateObjectId(doctorId, "doctor id");
  validateObjectId(appointmentId, "appointment id");
   await syncPastAppointmentStates();
  const session = await mongoose.startSession();

  try {
    let updatedAppointment = null;

    await session.withTransaction(async () => {
      const appointment = await findAppointmentForDoctorAction({
        doctorId,
        appointmentId,
        session,
      });

      ensureAppointmentCanBeCompleted(appointment);

      updatedAppointment = await completeAppointmentCore({
        appointment,
        session,
      });
    });

    return updatedAppointment;
  } finally {
    await session.endSession();
  }
};


export const getAdminAppointmentsService = async ({ query }) => {
  const { status } = query;

  validateAppointmentStatusFilter(status);

  await syncPastAppointmentStates();

  return findAdminAppointments({
    status,
  });
};

export const getAdminAppointmentDetailsService = async ({ appointmentId }) => {
  validateObjectId(appointmentId, "appointment id");

  await syncPastAppointmentStates();

  const appointment = await findAdminAppointmentById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return appointment;
};

export const approveAppointmentByAdminService = async ({ appointmentId }) => {
  validateObjectId(appointmentId, "appointment id");
   await syncPastAppointmentStates();
  const appointment = await findAppointmentForAdminAction({
    appointmentId,
  });

  ensurePendingAppointmentForDecision(appointment);

  appointment.status = "approved";
  appointment.approval = {
    approvedBy: "admin",
    approvedAt: new Date(),
  };

  appointment.rejection = {
    rejectedBy: "",
    reasonType: "",
    reason: "",
    rejectedAt: null,
  };

  await saveAppointment({
    appointment,
  });

  return appointment;
};

export const rejectAppointmentByAdminService = async ({
  appointmentId,
  body,
}) => {
  validateObjectId(appointmentId, "appointment id");
  validateRejectAppointmentInput(body);
      await syncPastAppointmentStates();
  const session = await mongoose.startSession();

  try {
    let updatedAppointment = null;

    await session.withTransaction(async () => {
      const appointment = await findAppointmentForAdminAction({
        appointmentId,
        session,
      });

      ensurePendingAppointmentForDecision(appointment);

      appointment.status = "rejected";
      appointment.paymentStatus = "refunded";

      appointment.rejection = {
        rejectedBy: "admin",
        reasonType: body.reasonType,
        reason: body.reason.trim(),
        rejectedAt: new Date(),
      };

      appointment.approval = {
        approvedBy: "",
        approvedAt: null,
      };

      await releaseAppointmentSlot({
        appointment,
        session,
      });

      await refundAppointmentPaymentToWallet({
        appointment,
        reason: "Appointment rejected by admin. Refund credited to wallet.",
        session,
      });

      await saveAppointment({
        appointment,
        session,
      });

      updatedAppointment = appointment;
    });

    return updatedAppointment;
  } finally {
    await session.endSession();
  }
};

export const cancelAppointmentByAdminService = async ({
  appointmentId,
  body,
}) => {
  validateObjectId(appointmentId, "appointment id");
  await syncPastAppointmentStates();
  const session = await mongoose.startSession();

  try {
    let updatedAppointment = null;

    await session.withTransaction(async () => {
      const appointment = await findAppointmentForAdminAction({
        appointmentId,
        session,
      });

      updatedAppointment = await cancelAppointmentCore({
        appointment,
        cancelledBy: "admin",
        body,
        session,
      });
    });

    return updatedAppointment;
  } finally {
    await session.endSession();
  }
};

const ensureAppointmentCanBeRescheduled = (appointment) => {
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status === "expired") {
  throw new AppError("Expired appointment cannot be rescheduled", 400);
}

ensureAppointmentTimeNotOver(appointment);

  if (!["pending", "approved"].includes(appointment.status)) {
    throw new AppError(
      "Only pending or approved appointments can be rescheduled",
      400
    );
  }

  if (appointment.paymentStatus !== "paid") {
    throw new AppError("Only paid appointments can be rescheduled", 400);
  }

  if (appointment.status === "completed") {
    throw new AppError("Completed appointment cannot be rescheduled", 400);
  }

  if (appointment.status === "cancelled") {
    throw new AppError("Cancelled appointment cannot be rescheduled", 400);
  }

  if (appointment.status === "rejected") {
    throw new AppError("Rejected appointment cannot be rescheduled", 400);
  }
};

export const rescheduleAppointmentByPatientService = async ({
  patientId,
  appointmentId,
  body,
}) => {
  validateObjectId(patientId, "patient id");
  validateObjectId(appointmentId, "appointment id");
  validateRescheduleAppointmentInput(body);

  const {
    newSlotDayId,
    newSlotId,
    newAppointmentDate,
    reasonType,
    reason,
  } = body;

  const session = await mongoose.startSession();

  try {
    let updatedAppointment = null;

    await session.withTransaction(async () => {
      const appointment = await findAppointmentForPatientAction({
        patientId,
        appointmentId,
        session,
      });

      ensureAppointmentCanBeRescheduled(appointment);

      const oldSlotDay = await findSlotDayById({
        slotDayId: appointment.slotDayId,
        doctorId: appointment.doctorId,
        session,
      });

      const newSlotDay = await findSlotDayById({
        slotDayId: newSlotDayId,
        doctorId: appointment.doctorId,
        session,
      });

      if (!newSlotDay) {
        throw new AppError("New slot day not found", 404);
      }

      if (newSlotDay.date !== newAppointmentDate) {
        throw new AppError(
          "Selected new slot date does not match appointment date",
          400
        );
      }

      if (newSlotDay.isHoliday) {
        throw new AppError("Cannot reschedule to a holiday", 400);
      }

      const newSlot = newSlotDay.slots.id(newSlotId);

      if (!newSlot || newSlot.isDeleted) {
        throw new AppError("New selected slot not found", 404);
      }

      if (newSlot.status !== "available") {
        throw new AppError("New selected slot is not available", 400);
      }
      
      ensureSlotHasEnoughLeadTime({
  appointmentDate: newAppointmentDate,
  startTime: newSlot.startTime,
});
      if (oldSlotDay) {
        const oldSlot = oldSlotDay.slots.id(appointment.slotId);

        if (oldSlot && !oldSlot.isDeleted && oldSlot.status === "booked") {
          oldSlot.status = "available";
          oldSlot.reservedBy = null;
          oldSlot.reservedAppointmentId = null;
          oldSlot.reservedUntil = null;

          await saveSlotDay({
            slotDay: oldSlotDay,
            session,
          });
        }
      }

      newSlot.status = "booked";
      newSlot.reservedBy = null;
      newSlot.reservedAppointmentId = null;
      newSlot.reservedUntil = null;

      const oldData = {
        oldSlotDayId: appointment.slotDayId,
        oldSlotId: appointment.slotId,
        oldAppointmentDate: appointment.appointmentDate,
        oldStartTime: appointment.startTime,
        oldEndTime: appointment.endTime,
      };

      appointment.slotDayId = new mongoose.Types.ObjectId(newSlotDayId);
      appointment.slotId = new mongoose.Types.ObjectId(newSlotId);
      appointment.appointmentDate = newAppointmentDate;
      appointment.startTime = newSlot.startTime;
      appointment.endTime = newSlot.endTime;

      appointment.status = "pending";
      appointment.approval = {
        approvedBy: "",
        approvedAt: null,
      };

      appointment.reschedule = {
        rescheduleCount: Number(appointment.reschedule?.rescheduleCount || 0) + 1,
        lastRescheduledAt: new Date(),
        lastReason: reason.trim(),
      };

      appointment.rescheduleHistory.push({
        ...oldData,
        newSlotDayId: new mongoose.Types.ObjectId(newSlotDayId),
        newSlotId: new mongoose.Types.ObjectId(newSlotId),
        newAppointmentDate,
        newStartTime: newSlot.startTime,
        newEndTime: newSlot.endTime,
        reasonType,
        reason: reason.trim(),
        rescheduledAt: new Date(),
      });

      await saveSlotDay({
        slotDay: newSlotDay,
        session,
      });

      await saveAppointment({
        appointment,
        session,
      });

      updatedAppointment = appointment;
    });

    return updatedAppointment;
  } finally {
    await session.endSession();
  }
};