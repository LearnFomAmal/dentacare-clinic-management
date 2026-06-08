import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getMyDoctorEarningsApi = async (params = {}) => {
  const response = await axiosInstance.get(API_ENDPOINTS.EARNINGS.DOCTOR_ME, {
    params,
  });

  return response.data;
};

export const getAdminDoctorEarningsApi = async ({
  doctorId,
  params = {},
}) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.EARNINGS.ADMIN_DOCTOR(doctorId),
    {
      params,
    }
  );

  return response.data;
};