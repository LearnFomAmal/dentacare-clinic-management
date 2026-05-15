import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getPatientsApi = async (params = {}) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.USER.ADMIN_GET_PATIENTS,
    {
      params,
    }
  );

  return response.data;
};

export const getPatientDetailsApi = async (id) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.USER.ADMIN_GET_PATIENT_DETAILS(id)
  );

  return response.data;
};

export const blockPatientApi = async (id) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.USER.ADMIN_BLOCK_PATIENT(id)
  );

  return response.data;
};

export const unblockPatientApi = async (id) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.USER.ADMIN_UNBLOCK_PATIENT(id)
  );

  return response.data;
};