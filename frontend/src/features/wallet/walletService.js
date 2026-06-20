import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getMyWalletApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.WALLET.ME);

  return response.data;
};

export const getWalletTransactionsApi = async (params = {}) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.WALLET.TRANSACTIONS,
    {
      params,
    }
  );

  return response.data;
};

export const createWalletRazorpayOrderApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.WALLET.CREATE_RAZORPAY_ORDER,
    payload
  );

  return response.data;
};

export const verifyWalletRazorpayTopupApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.WALLET.VERIFY_RAZORPAY_TOPUP,
    payload
  );

  return response.data;
};

export const cancelWalletRazorpayTopupApi = async (payload) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.WALLET.CANCEL_RAZORPAY_TOPUP,
    payload
  );

  return response.data;
};