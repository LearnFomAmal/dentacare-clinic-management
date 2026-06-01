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

export const topupWalletApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.WALLET.TOPUP,
    payload
  );

  return response.data;
};