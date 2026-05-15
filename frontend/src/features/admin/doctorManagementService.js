import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getDoctorsApi = async (params = {}) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.DOCTOR.ADMIN_GET_ALL,
    { params }
  );

  return response.data;
};

export const createDoctorApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.DOCTOR.ADMIN_CREATE,
    payload
  );

  return response.data;
};

export const getDoctorDetailsApi = async (id) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.DOCTOR.ADMIN_GET_DETAILS(id)
  );

  return response.data;
};

export const blockDoctorApi = async (id) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.DOCTOR.ADMIN_BLOCK(id)
  );

  return response.data;
};

export const unblockDoctorApi = async (id) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.DOCTOR.ADMIN_UNBLOCK(id)
  );

  return response.data;
};

export const updateDoctorConsultationFeeApi = async (
  id,
  consultationFee
) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.DOCTOR.ADMIN_UPDATE_CONSULTATION_FEE(id),
    { consultationFee }
  );

  return response.data;
};