import Appointment from "../../models/Appointment.js";
import DoctorSlot from "../../models/DoctorSlot.js";
import Payment from "../../models/Payment.js";
import Coupon from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";

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
// COUPON HELPERS FOR PAYMENT
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