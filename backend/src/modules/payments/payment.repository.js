import Appointment from "../../models/Appointment.js";
import DoctorSlot from "../../models/DoctorSlot.js";
import Payment from "../../models/Payment.js";
import Coupon from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";
import Referral from "../../models/Referral.js";
import ReferralConfig from "../../models/ReferralConfig.js";

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

export const deleteAppointmentById = ({
  appointmentId,
  patientId,
  session = null,
}) => {
  return Appointment.deleteOne({
    _id: appointmentId,
    patientId,
    status: "pending_payment",
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

export const findPaymentByRazorpayOrderId = ({
  orderId,
  session = null,
}) => {
  return Payment.findOne({
    "razorpay.orderId": orderId,
  }).session(session);
};

export const createPayment = async ({ payload, session = null }) => {
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

export const saveAppointment = ({ appointment, session = null }) => {
  return appointment.save({ session });
};

export const saveSlotDay = ({ slotDay, session = null }) => {
  return slotDay.save({ session });
};

// ==============================
// COUPON HELPERS
// ==============================
export const findCouponForPayment = ({ couponId, session = null }) => {
  return Coupon.findOne({
    _id: couponId,
    isDeleted: false,
  }).session(session);
};

export const countCompletedCouponUsageByUser = ({
  userId,
  couponId,
  session = null,
}) => {
  return CouponUsage.countDocuments({
    userId,
    couponId,
    status: "completed",
  }).session(session);
};

export const createCouponUsage = async ({ payload, session = null }) => {
  const usages = await CouponUsage.create([payload], { session });
  return usages[0];
};

export const incrementCouponUsedCountSafely = ({
  couponId,
  session = null,
}) => {
  return Coupon.updateOne(
    {
      _id: couponId,
      isDeleted: false,
      isActive: true,
      $expr: {
        $or: [
          { $eq: ["$maxUsage", 0] },
          { $lt: ["$usedCount", "$maxUsage"] },
        ],
      },
    },
    {
      $inc: {
        usedCount: 1,
      },
    }
  ).session(session);
};

// ==============================
// REFERRAL HELPERS
// ==============================
export const findReferralForPayment = ({
  referralId,
  referredUserId,
  session = null,
}) => {
  return Referral.findOne({
    _id: referralId,
    referredUserId,
    status: "pending",
    discountUsedAt: null,
    firstAppointmentId: null,
  }).session(session);
};

export const findActiveReferralConfigForPayment = ({
  session = null,
}) => {
  return ReferralConfig.findOne({
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .session(session);
};

export const markReferralDiscountUsedForPayment = ({
  referralId,
  referredUserId,
  appointmentId,
  refereeDiscount,
  referrerReward,
  session = null,
}) => {
  return Referral.findOneAndUpdate(
    {
      _id: referralId,
      referredUserId,
      status: "pending",
      discountUsedAt: null,
      firstAppointmentId: null,
    },
    {
      status: "discount_used",
      firstAppointmentId: appointmentId,
      refereeDiscount,
      referrerReward,
      rewardStatus: "not_ready",
      discountUsedAt: new Date(),
    },
    {
      new: true,
      session,
    }
  );
};