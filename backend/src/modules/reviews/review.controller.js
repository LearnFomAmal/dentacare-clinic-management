import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  approveReviewByAdminService,
  createReviewService,
  deleteMyReviewService,
  getAdminReviewDetailsService,
  getAdminReviewsService,
  getDoctorOwnReviewsService,
  getDoctorReviewSummaryService,
  getMyReviewDetailsService,
  getMyReviewsService,
  getPublicDoctorReviewsService,
  rejectReviewByAdminService,
  updateMyReviewService,
} from "./review.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

const getDoctorId = (req) => {
  return req.doctor?.doctorId || req.doctor?._id || req.doctor?.id;
};

export const createReviewController = asyncHandler(async (req, res) => {
  const patientId = getPatientId(req);

  const review = await createReviewService({
    patientId,
    body: req.body,
  });

  sendResponse(
    res,
    201,
    true,
    "Review submitted successfully. It will be visible after admin approval.",
    review
  );
});

export const getMyReviewsController = asyncHandler(async (req, res) => {
  const patientId = getPatientId(req);

  const result = await getMyReviewsService({
    patientId,
    query: req.query,
  });

  sendResponse(
    res,
    200,
    true,
    "My reviews fetched successfully",
    result
  );
});

export const getMyReviewDetailsController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientId(req);

    const review = await getMyReviewDetailsService({
      patientId,
      reviewId: req.params.reviewId,
    });

    sendResponse(
      res,
      200,
      true,
      "Review details fetched successfully",
      review
    );
  }
);

export const updateMyReviewController = asyncHandler(async (req, res) => {
  const patientId = getPatientId(req);

  const review = await updateMyReviewService({
    patientId,
    reviewId: req.params.reviewId,
    body: req.body,
  });

  sendResponse(
    res,
    200,
    true,
    "Review updated successfully. It will be visible after admin approval.",
    review
  );
});

export const deleteMyReviewController = asyncHandler(async (req, res) => {
  const patientId = getPatientId(req);

  const result = await deleteMyReviewService({
    patientId,
    reviewId: req.params.reviewId,
  });

  sendResponse(
    res,
    200,
    true,
    "Review deleted successfully",
    result
  );
});

export const getPublicDoctorReviewsController = asyncHandler(
  async (req, res) => {
    const result = await getPublicDoctorReviewsService({
      doctorId: req.params.doctorId,
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Doctor reviews fetched successfully",
      result
    );
  }
);

export const getDoctorReviewSummaryController = asyncHandler(
  async (req, res) => {
    const summary = await getDoctorReviewSummaryService({
      doctorId: req.params.doctorId,
    });

    sendResponse(
      res,
      200,
      true,
      "Doctor review summary fetched successfully",
      summary
    );
  }
);

export const getDoctorOwnReviewsController = asyncHandler(
  async (req, res) => {
    const doctorId = getDoctorId(req);

    const result = await getDoctorOwnReviewsService({
      doctorId,
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Doctor reviews fetched successfully",
      result
    );
  }
);

export const getAdminReviewsController = asyncHandler(async (req, res) => {
  const result = await getAdminReviewsService({
    query: req.query,
  });

  sendResponse(
    res,
    200,
    true,
    "Reviews fetched successfully",
    result
  );
});

export const getAdminReviewDetailsController = asyncHandler(
  async (req, res) => {
    const review = await getAdminReviewDetailsService({
      reviewId: req.params.reviewId,
    });

    sendResponse(
      res,
      200,
      true,
      "Review details fetched successfully",
      review
    );
  }
);

export const approveReviewByAdminController = asyncHandler(
  async (req, res) => {
    const review = await approveReviewByAdminService({
      reviewId: req.params.reviewId,
    });

    sendResponse(
      res,
      200,
      true,
      "Review approved successfully",
      review
    );
  }
);

export const rejectReviewByAdminController = asyncHandler(
  async (req, res) => {
    const review = await rejectReviewByAdminService({
      reviewId: req.params.reviewId,
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Review rejected successfully",
      review
    );
  }
);