import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const createReviewApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.REVIEW.CREATE,
    payload
  );

  return response.data;
};

export const getMyReviewsApi = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.REVIEW.MY, {
    params,
  });

  return response.data;
};

export const getMyReviewDetailsApi = async (reviewId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REVIEW.MY_DETAILS(reviewId)
  );

  return response.data;
};

export const updateMyReviewApi = async ({ reviewId, payload }) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.REVIEW.UPDATE_MY(reviewId),
    payload
  );

  return response.data;
};

export const deleteMyReviewApi = async (reviewId) => {
  const response = await axiosInstance.delete(
    API_ENDPOINTS.REVIEW.DELETE_MY(reviewId)
  );

  return response.data;
};

export const getPublicDoctorReviewsApi = async ({ doctorId, params }) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REVIEW.PUBLIC_DOCTOR_REVIEWS(doctorId),
    {
      params,
    }
  );

  return response.data;
};

export const getPublicDoctorReviewSummaryApi = async (doctorId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REVIEW.PUBLIC_DOCTOR_SUMMARY(doctorId)
  );

  return response.data;
};

export const getDoctorOwnReviewsApi = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.REVIEW.DOCTOR_ME, {
    params,
  });

  return response.data;
};

export const getAdminReviewsApi = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.REVIEW.ADMIN_GET_ALL, {
    params,
  });

  return response.data;
};

export const getAdminReviewDetailsApi = async (reviewId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REVIEW.ADMIN_GET_DETAILS(reviewId)
  );

  return response.data;
};

export const approveReviewApi = async (reviewId) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.REVIEW.ADMIN_APPROVE(reviewId)
  );

  return response.data;
};

export const rejectReviewApi = async ({ reviewId, rejectionReason }) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.REVIEW.ADMIN_REJECT(reviewId),
    {
      rejectionReason,
    }
  );

  return response.data;
};