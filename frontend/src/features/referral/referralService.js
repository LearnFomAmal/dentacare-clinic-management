import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getMyReferralApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.REFERRAL.ME);

  return response.data;
};

export const getMyReferralHistoryApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.REFERRAL.HISTORY);

  return response.data;
};

export const getAdminReferralsApi = async (params = {}) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REFERRAL.ADMIN_GET_ALL,
    {
      params,
    }
  );

  return response.data;
};

export const getReferralConfigApi = async () => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REFERRAL.ADMIN_CONFIG
  );

  return response.data;
};

export const updateReferralConfigApi = async (payload) => {
  const response = await axiosInstance.put(
    API_ENDPOINTS.REFERRAL.ADMIN_CONFIG,
    payload
  );

  return response.data;
};