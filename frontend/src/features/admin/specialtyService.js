import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getAllSpecialtiesApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.SPECIALTY.GET_ALL);

  return response.data;
};

export const createSpecialtyApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.SPECIALTY.CREATE,
    payload
  );

  return response.data;
};

export const updateSpecialtyApi = async (id, payload) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.SPECIALTY.UPDATE(id),
    payload
  );

  return response.data;
};

export const updateSpecialtyStatusApi = async (id, status) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.SPECIALTY.UPDATE_STATUS(id),
    { status }
  );

  return response.data;
};