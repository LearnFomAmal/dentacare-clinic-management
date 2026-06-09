import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

import {
  countAdminReviews,
  countDoctorOwnReviews,
  countPatientReviews,
  countPublicApprovedReviewsByDoctor,
  createReview,
  findActiveReviewByAppointmentId,
  findAdminReviews,
  findApprovedReviewStatsByDoctor,
  findCompletedAppointmentForReview,
  findDoctorExistsForReview,
  findDoctorOwnReviews,
  findDoctorsForReviewSearch,
  findPatientReviews,
  findPublicApprovedReviewsByDoctor,
  findReviewByIdForAdmin,
  findReviewForPatientAction,
  findUsersForReviewSearch,
  getApprovedReviewStatsByDoctor,
  getRatingDistributionByDoctor,
  updateDoctorReviewStats,
} from "./review.repository.js";

import {
  validateCreateReviewInput,
  validateObjectId,
  validatePagination,
  validateRatingFilter,
  validateRejectReviewInput,
  validateReviewStatus,
  validateUpdateReviewInput,
} from "./review.validator.js";

const normalizeAverageRating = (value) => {
  return Math.round(Number(value || 0) * 10) / 10;
};

export const recalculateDoctorRatingStats = async (doctorId) => {
  const stats = await getApprovedReviewStatsByDoctor(doctorId);

  const averageRating = normalizeAverageRating(stats.averageRating);
  const totalReviews = Number(stats.totalReviews || 0);

  await updateDoctorReviewStats({
    doctorId,
    averageRating,
    totalReviews,
  });

  return {
    averageRating,
    totalReviews,
  };
};

const buildReviewSearchFilter = async ({ search, filter }) => {
  if (!search || !search.trim()) {
    return filter;
  }

  const regex = new RegExp(search.trim(), "i");

  const [matchedUsers, matchedDoctors] = await Promise.all([
    findUsersForReviewSearch(search),
    findDoctorsForReviewSearch(search),
  ]);

  const userIds = matchedUsers.map((user) => user._id);
  const doctorIds = matchedDoctors.map((doctor) => doctor._id);

  filter.$or = [
    {
      description: regex,
    },
    {
      rejectionReason: regex,
    },
    {
      patientId: {
        $in: userIds,
      },
    },
    {
      doctorId: {
        $in: doctorIds,
      },
    },
  ];

  return filter;
};

export const createReviewService = async ({ patientId, body }) => {
  validateObjectId(patientId, "patient id");
  validateCreateReviewInput(body);

  const { appointmentId, rating, description } = body;

  const appointment = await findCompletedAppointmentForReview({
    appointmentId,
    patientId,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.status !== "completed") {
    throw new AppError(
      "You can review only completed appointments",
      400
    );
  }

  if (appointment.paymentStatus !== "paid") {
    throw new AppError(
      "You can review only paid completed appointments",
      400
    );
  }

  const existingReview = await findActiveReviewByAppointmentId(
    appointmentId
  );

  if (existingReview) {
    throw new AppError(
      "Review already exists for this appointment",
      409
    );
  }

  try {
    return await createReview({
      patientId: new mongoose.Types.ObjectId(patientId),
      doctorId: appointment.doctorId,
      appointmentId: appointment._id,
      rating: Number(rating),
      description: description.trim(),
      status: "pending",
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "Review already exists for this appointment",
        409
      );
    }

    throw error;
  }
};

export const getMyReviewsService = async ({ patientId, query }) => {
  validateObjectId(patientId, "patient id");

  const { status = "", rating = "" } = query;

  validateReviewStatus(status);
  validateRatingFilter(rating);

  const { page, limit } = validatePagination(query);
  const skip = (page - 1) * limit;

  const filter = {
    patientId,
    isDeleted: false,
  };

  if (status) {
    filter.status = status;
  }

  if (rating !== "") {
    filter.rating = Number(rating);
  }

  const [reviews, totalReviews] = await Promise.all([
    findPatientReviews({
      filter,
      skip,
      limit,
    }),
    countPatientReviews(filter),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  };
};

export const getMyReviewDetailsService = async ({
  patientId,
  reviewId,
}) => {
  validateObjectId(patientId, "patient id");
  validateObjectId(reviewId, "review id");

  const review = await findReviewForPatientAction({
    patientId,
    reviewId,
  });

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  return review;
};

export const updateMyReviewService = async ({
  patientId,
  reviewId,
  body,
}) => {
  validateObjectId(patientId, "patient id");
  validateObjectId(reviewId, "review id");
  validateUpdateReviewInput(body);

  const review = await findReviewForPatientAction({
    patientId,
    reviewId,
  });

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  const wasApproved = review.status === "approved";

  if (body.rating !== undefined) {
    review.rating = Number(body.rating);
  }

  if (body.description !== undefined) {
    review.description = body.description.trim();
  }

  review.status = "pending";
  review.rejectionReason = "";
  review.rejectedAt = null;
  review.approvedAt = null;

  if (wasApproved) {
    review.editedAfterApproval = true;
  }

  await review.save();

  if (wasApproved) {
    await recalculateDoctorRatingStats(review.doctorId);
  }

  return review;
};

export const deleteMyReviewService = async ({ patientId, reviewId }) => {
  validateObjectId(patientId, "patient id");
  validateObjectId(reviewId, "review id");

  const review = await findReviewForPatientAction({
    patientId,
    reviewId,
  });

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  const wasApproved = review.status === "approved";
  const doctorId = review.doctorId;

  review.isDeleted = true;
  review.deletedAt = new Date();

  await review.save();

  if (wasApproved) {
    await recalculateDoctorRatingStats(doctorId);
  }

  return {
    _id: review._id,
  };
};

export const getPublicDoctorReviewsService = async ({
  doctorId,
  query,
}) => {
  validateObjectId(doctorId, "doctor id");

  const doctor = await findDoctorExistsForReview(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const { page, limit } = validatePagination(query);
  const skip = (page - 1) * limit;

  const [reviews, totalReviews] = await Promise.all([
    findPublicApprovedReviewsByDoctor({
      doctorId,
      skip,
      limit,
    }),
    countPublicApprovedReviewsByDoctor(doctorId),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  };
};

export const getDoctorReviewSummaryService = async ({ doctorId }) => {
  validateObjectId(doctorId, "doctor id");

  const doctor = await findDoctorExistsForReview(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const [stats, ratingDistribution] = await Promise.all([
    getApprovedReviewStatsByDoctor(doctorId),
    getRatingDistributionByDoctor(doctorId),
  ]);

  return {
    averageRating: normalizeAverageRating(stats.averageRating),
    totalReviews: Number(stats.totalReviews || 0),
    ratingDistribution,
  };
};

export const getDoctorOwnReviewsService = async ({
  doctorId,
  query,
}) => {
  validateObjectId(doctorId, "doctor id");

  const { status = "", rating = "" } = query;

  validateReviewStatus(status);
  validateRatingFilter(rating);

  const { page, limit } = validatePagination(query);
  const skip = (page - 1) * limit;

  const filter = {
    doctorId,
    isDeleted: false,
  };

  if (status) {
    filter.status = status;
  }

  if (rating !== "") {
    filter.rating = Number(rating);
  }

  const [reviews, totalReviews] = await Promise.all([
    findDoctorOwnReviews({
      filter,
      skip,
      limit,
    }),
    countDoctorOwnReviews(filter),
  ]);

  const summary = await getDoctorReviewSummaryService({
    doctorId,
  });

  return {
    reviews,
    summary,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  };
};

export const getAdminReviewsService = async ({ query }) => {
  const {
    status = "",
    rating = "",
    doctorId = "",
    patientId = "",
    search = "",
  } = query;

  validateReviewStatus(status);
  validateRatingFilter(rating);

  if (doctorId) {
    validateObjectId(doctorId, "doctor id");
  }

  if (patientId) {
    validateObjectId(patientId, "patient id");
  }

  const { page, limit } = validatePagination(query);
  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: false,
  };

  if (status) {
    filter.status = status;
  }

  if (rating !== "") {
    filter.rating = Number(rating);
  }

  if (doctorId) {
    filter.doctorId = doctorId;
  }

  if (patientId) {
    filter.patientId = patientId;
  }

  await buildReviewSearchFilter({
    search,
    filter,
  });

  const [reviews, totalReviews] = await Promise.all([
    findAdminReviews({
      filter,
      skip,
      limit,
    }),
    countAdminReviews(filter),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  };
};

export const getAdminReviewDetailsService = async ({ reviewId }) => {
  validateObjectId(reviewId, "review id");

  const review = await findReviewByIdForAdmin(reviewId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  return review;
};

export const approveReviewByAdminService = async ({ reviewId }) => {
  validateObjectId(reviewId, "review id");

  const review = await findReviewByIdForAdmin(reviewId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (review.status === "approved") {
    throw new AppError("Review is already approved", 400);
  }

  review.status = "approved";
  review.approvedAt = new Date();
  review.rejectedAt = null;
  review.rejectionReason = "";
  review.editedAfterApproval = false;

  await review.save();

  await recalculateDoctorRatingStats(review.doctorId);

  return review;
};

export const rejectReviewByAdminService = async ({ reviewId, body }) => {
  validateObjectId(reviewId, "review id");
  validateRejectReviewInput(body);

  const review = await findReviewByIdForAdmin(reviewId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (review.status === "rejected") {
    throw new AppError("Review is already rejected", 400);
  }

  const wasApproved = review.status === "approved";
  const doctorId = review.doctorId;

  review.status = "rejected";
  review.rejectionReason = body.rejectionReason.trim();
  review.rejectedAt = new Date();
  review.approvedAt = null;

  await review.save();

  if (wasApproved) {
    await recalculateDoctorRatingStats(doctorId);
  }

  return review;
};