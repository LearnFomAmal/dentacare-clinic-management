import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";
import { findUserById } from "../users/user.repository.js";
import {
  creditReferralRewardToWallet,
  refundAppointmentPaymentToWallet,
} from "../wallets/wallet.service.js";
import {
  validateCouponForAppointment,
} from "../coupons/coupon.service.js";
import {
  claimReferralRewardForCompletion,
  createAppointment,
  findAdminAppointmentById,
  findAdminAppointments,
  findAppointmentForAdminAction,
  findAppointmentForDoctorAction,
  findDoctorAppointmentById,
  findDoctorAppointments,
  findDoctorForBooking,
  findAppointmentByIdForPatient,
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
} from "./appointment.repository.js";
import {
  getReferralDiscountForAppointment,
} from "../referrals/referral.service.js";
import {
  validateAppointmentStatusFilter,
  validateInitiateAppointmentInput,
  validateObjectId,
  validateRejectAppointmentInput,
} from "./appointment.validator.js";

const RESERVATION_MINUTES = 10;

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
  return (
    report?.file?.url ||
    report?.fileUrl ||
    report?.url ||
    ""
  );
};

const normalizeAppointmentReport = (report) => {
  return {
    reportId: report._id,
    title: report.title || "",
    reportType: report.reportType || "other",
    fileUrl: getReportFileUrl(report),
  };
};

const ensurePendingAppointmentForDecision = (appointment) => {
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
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
};

const ensureAppointmentCanBeCompleted = (appointment) => {
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status === "completed") {
    throw new AppError("Appointment is already completed", 400);
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
};

const releaseBookedSlot = async ({
  appointment,
  session,
}) => {
  const slotDay = await findSlotDayById({
    slotDayId: appointment.slotDayId,
    doctorId: appointment.doctorId,
    session,
  });

  if (!slotDay) {
    return;
  }

  const slot = slotDay.slots.id(appointment.slotId);

  if (!slot || slot.isDeleted) {
    return;
  }

  if (slot.status === "booked") {
    slot.status = "available";

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

      if (selectedSlot.status !== "available") {
        throw new AppError("Selected slot is not available", 400);
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

  const appointment = await findAppointmentByIdForPatient({
    patientId,
    appointmentId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return appointment;
};

export const getMyAppointmentsService = async ({
  patientId,
  query,
}) => {
  validateObjectId(patientId, "patient id");

  const { status } = query;

  validateAppointmentStatusFilter(status);

  return findPatientAppointments({
    patientId,
    status,
  });
};

export const getDoctorAppointmentsService = async ({
  doctorId,
  query,
}) => {
  validateObjectId(doctorId, "doctor id");

  const { status } = query;

  validateAppointmentStatusFilter(status);

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

  const appointment = await findDoctorAppointmentById({
    doctorId,
    appointmentId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return appointment;
};

export const getAdminAppointmentsService = async ({
  query,
}) => {
  const { status } = query;

  validateAppointmentStatusFilter(status);

  return findAdminAppointments({
    status,
  });
};

export const getAdminAppointmentDetailsService = async ({
  appointmentId,
}) => {
  validateObjectId(appointmentId, "appointment id");

  const appointment = await findAdminAppointmentById(appointmentId);

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

      await releaseBookedSlot({
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

      appointment.status = "completed";
      appointment.completedAt = new Date();

      await saveAppointment({
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
          const claimedReferral =
            await claimReferralRewardForCompletion({
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

      updatedAppointment = appointment;
    });

    return updatedAppointment;
  } finally {
    await session.endSession();
  }
};

export const approveAppointmentByAdminService = async ({
  appointmentId,
}) => {
  validateObjectId(appointmentId, "appointment id");

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

      await releaseBookedSlot({
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