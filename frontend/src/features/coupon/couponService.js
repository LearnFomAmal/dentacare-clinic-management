import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getAvailableCouponsApi = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.COUPON.AVAILABLE, {
    params,
  });

  return response.data;
};

export const validateCouponApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.COUPON.VALIDATE,
    payload
  );

  return response.data;
};

export const createCouponApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.COUPON.ADMIN_CREATE,
    payload
  );

  return response.data;
};

export const getAdminCouponsApi = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.COUPON.ADMIN_GET_ALL, {
    params,
  });

  return response.data;
};

export const getAdminCouponDetailsApi = async (couponId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.COUPON.ADMIN_GET_DETAILS(couponId)
  );

  return response.data;
};

export const updateCouponApi = async ({ couponId, payload }) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.COUPON.ADMIN_UPDATE(couponId),
    payload
  );

  return response.data;
};

export const updateCouponStatusApi = async ({ couponId, isActive }) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.COUPON.ADMIN_UPDATE_STATUS(couponId),
    { isActive }
  );

  return response.data;
};

export const deleteCouponApi = async (couponId) => {
  const response = await axiosInstance.delete(
    API_ENDPOINTS.COUPON.ADMIN_DELETE(couponId)
  );

  return response.data;
};