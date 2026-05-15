import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getCurrentAdminApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.ME);

  return response.data;
};