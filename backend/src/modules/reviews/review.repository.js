import mongoose from "mongoose";

import Appointment from "../../models/Appointment.js";
import Doctor from "../../models/Doctor.js";
import Review from "../../models/Review.js";
import User from "../../models/User.js";

const reviewPopulate = [
  {
    path: "patientId",
    select: "username email personalInfo.profileImage createdAt",
  },
  {
    path: "doctorId",
    select:
      "firstName lastName email specialization professionalInfo stats accountStatus",
  },
  {
    path: "appointmentId",
    select:
      "appointmentDate startTime endTime status paymentStatus reason pricing completedAt",
  },
];

export const findCompletedAppointmentForReview = ({
  appointmentId,
  patientId,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    patientId,
  });
};

export const createReview = (payload) => {
  return Review.create(payload);
};

export const findActiveReviewByAppointmentId = (appointmentId) => {
  return Review.findOne({
    appointmentId,
    isDeleted: false,
  });
};

export const findReviewForPatientAction = ({ reviewId, patientId }) => {
  return Review.findOne({
    _id: reviewId,
    patientId,
    isDeleted: false,
  });
};

export const findPatientReviews = ({ filter, skip, limit }) => {
  return Review.find(filter)
    .populate(reviewPopulate)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countPatientReviews = (filter) => {
  return Review.countDocuments(filter);
};

export const findAdminReviews = ({ filter, skip, limit }) => {
  return Review.find(filter)
    .populate(reviewPopulate)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAdminReviews = (filter) => {
  return Review.countDocuments(filter);
};

export const findReviewByIdForAdmin = (reviewId) => {
  return Review.findOne({
    _id: reviewId,
    isDeleted: false,
  }).populate(reviewPopulate);
};

export const findPublicApprovedReviewsByDoctor = ({
  doctorId,
  skip,
  limit,
}) => {
  return Review.find({
    doctorId,
    status: "approved",
    isDeleted: false,
  })
    .populate("patientId", "username personalInfo.profileImage")
    .select(
      "_id patientId doctorId appointmentId rating description createdAt updatedAt"
    )
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countPublicApprovedReviewsByDoctor = (doctorId) => {
  return Review.countDocuments({
    doctorId,
    status: "approved",
    isDeleted: false,
  });
};

export const findDoctorOwnReviews = ({ filter, skip, limit }) => {
  return Review.find(filter)
    .populate(reviewPopulate)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countDoctorOwnReviews = (filter) => {
  return Review.countDocuments(filter);
};

export const getApprovedReviewStatsByDoctor = async (doctorId) => {
  const result = await Review.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        status: "approved",
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$doctorId",
        averageRating: {
          $avg: "$rating",
        },
        totalReviews: {
          $sum: 1,
        },
      },
    },
  ]);

  return (
    result[0] || {
      averageRating: 0,
      totalReviews: 0,
    }
  );
};

export const getRatingDistributionByDoctor = async (doctorId) => {
  const result = await Review.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        status: "approved",
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$rating",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  result.forEach((item) => {
    distribution[item._id] = item.count;
  });

  return distribution;
};

export const updateDoctorReviewStats = ({
  doctorId,
  averageRating,
  totalReviews,
}) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "stats.averageRating": averageRating,
      "stats.totalReviews": totalReviews,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

export const findUsersForReviewSearch = (search) => {
  const regex = new RegExp(search.trim(), "i");

  return User.find({
    $or: [
      {
        username: regex,
      },
      {
        email: regex,
      },
    ],
  })
    .select("_id")
    .lean();
};

export const findDoctorsForReviewSearch = (search) => {
  const regex = new RegExp(search.trim(), "i");

  return Doctor.find({
    $or: [
      {
        firstName: regex,
      },
      {
        lastName: regex,
      },
      {
        email: regex,
      },
      {
        "specialization.name": regex,
      },
      {
        "specialization.displayName": regex,
      },
    ],
  })
    .select("_id")
    .lean();
};

export const findDoctorExistsForReview = (doctorId) => {
  return Doctor.findOne({
    _id: doctorId,
    "accountStatus.isDeleted": false,
  }).select("_id stats accountStatus");
};