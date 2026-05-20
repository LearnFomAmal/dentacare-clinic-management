import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getMyDoctorProfileApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.DOCTOR.ME);
  return response.data;
};

export const updateDoctorProfileApi = async (payload) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.DOCTOR.UPDATE_PROFILE,
    payload
  );

  return response.data;
};

export const updateDoctorThemeApi = async (theme) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.DOCTOR.UPDATE_THEME,
    { theme }
  );

  return response.data;
};

export const changeDoctorPasswordApi = async (payload) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.DOCTOR.CHANGE_PASSWORD,
    payload
  );

  return response.data;
};

export const deleteDoctorAccountApi = async () => {
  const response = await axiosInstance.delete(
    API_ENDPOINTS.DOCTOR.DELETE_ACCOUNT
  );

  return response.data;
};

export const getDoctorSessionsApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.DOCTOR.SESSIONS);
  return response.data;
};

export const updateDoctorProfileImageApi = async (file) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  const response = await axiosInstance.patch(
    API_ENDPOINTS.DOCTOR.UPDATE_PROFILE_IMAGE,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};