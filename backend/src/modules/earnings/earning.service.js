import mongoose from "mongoose";
import AppError from "../../shared/errors/AppError.js";

import {
  countDoctorEarningTransactions,
  getDoctorEarningSummary,
  getDoctorEarningTransactions,
} from "./earning.repository.js";

const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

const getPagination = (query = {}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 50);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

const getIstDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getIstMonthString = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(date);
};

const buildIstDayRange = () => {
  const today = getIstDateString();

  const start = new Date(`${today}T00:00:00.000+05:30`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
};

const buildIstMonthRange = () => {
  const month = getIstMonthString();
  const [year, monthNumber] = month.split("-").map(Number);

  const start = new Date(
    `${year}-${String(monthNumber).padStart(2, "0")}-01T00:00:00.000+05:30`
  );

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return {
    start,
    end,
  };
};

const normalizeTransaction = (transaction) => {
  return {
    _id: transaction._id,

    doctorId: transaction.doctorId,

    patient: transaction.patientId
      ? {
          _id: transaction.patientId._id,
          username: transaction.patientId.username,
          email: transaction.patientId.email,
          personalInfo: transaction.patientId.personalInfo,
        }
      : null,

    appointment: transaction.appointmentId
      ? {
          _id: transaction.appointmentId._id,
          appointmentDate: transaction.appointmentId.appointmentDate,
          startTime: transaction.appointmentId.startTime,
          endTime: transaction.appointmentId.endTime,
          status: transaction.appointmentId.status,
          paymentStatus: transaction.appointmentId.paymentStatus,
          completedAt: transaction.appointmentId.completedAt,
        }
      : null,

    consultationFee: transaction.consultationFee,
    couponDiscount: transaction.couponDiscount,
    referralDiscount: transaction.referralDiscount,
    rewardDiscount: transaction.rewardDiscount,
    totalDiscount: transaction.totalDiscount,
    finalAmount: transaction.finalAmount,
    earnedAmount: transaction.earnedAmount,

    paymentMethod: transaction.paymentMethod,
    transactionId: transaction.transactionId,
    earningStatus: transaction.earningStatus,

    appointmentDate: transaction.appointmentDate,
    startTime: transaction.startTime,
    endTime: transaction.endTime,

    earnedAt: transaction.earnedAt,
    createdAt: transaction.createdAt,
  };
};

export const getDoctorEarningsService = async ({ doctorId, query = {} }) => {
  validateObjectId(doctorId, "doctor id");

  const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

  const { page, limit, skip } = getPagination(query);

  const todayRange = buildIstDayRange();
  const monthRange = buildIstMonthRange();

  const [summary, transactions, totalTransactions] = await Promise.all([
    getDoctorEarningSummary({
      doctorId: doctorObjectId,
      todayStart: todayRange.start,
      todayEnd: todayRange.end,
      monthStart: monthRange.start,
      monthEnd: monthRange.end,
    }),

    getDoctorEarningTransactions({
      doctorId: doctorObjectId,
      skip,
      limit,
    }),

    countDoctorEarningTransactions({
      doctorId: doctorObjectId,
    }),
  ]);

  return {
    summary: {
      todayEarned: summary.todayEarned || 0,
      monthlyEarned: summary.monthlyEarned || 0,
      totalEarned: summary.totalEarned || 0,
      totalTransactions: summary.totalTransactions || 0,
    },

    transactions: transactions.map(normalizeTransaction),

    pagination: {
      page,
      limit,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
    },
  };
};