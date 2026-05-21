import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getPublicDoctorsApi = async (params) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.DOCTOR.PUBLIC.GET_ALL,
    {
      params,
    }
  );

  return response.data;
};

export const getPublicDoctorDetailsApi = async (doctorId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.DOCTOR.PUBLIC.GET_DETAILS(doctorId)
  );

  return response.data;
};

export const getPublicDoctorAvailableSlotsApi = async ({
  doctorId,
  date,
}) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.DOCTOR.PUBLIC.AVAILABLE_SLOTS(doctorId),
    {
      params: {
        date,
      },
    }
  );

  return response.data;
};

export const getPublicSpecialtiesApi = async () => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.SPECIALTY.GET_ACTIVE_PUBLIC
  );

  return response.data;
};