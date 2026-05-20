import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getMyProfileApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.USER.ME);
  return response.data;
};

export const updateMyProfileApi = async (payload) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.USER.UPDATE_PROFILE,
    payload
  );

  return response.data;
};

export const updateUserThemeApi = async (theme) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.USER.UPDATE_THEME,
    { theme }
  );

  return response.data;
};

export const changeUserPasswordApi = async (payload) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.USER.CHANGE_PASSWORD,
    payload
  );

  return response.data;
};

export const deleteUserAccountApi = async () => {
  const response = await axiosInstance.delete(
    API_ENDPOINTS.USER.DELETE_ACCOUNT
  );

  return response.data;
};

export const getUserSessionsApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.USER.SESSIONS);
  return response.data;
};

export const updateUserProfileImageApi = async (file) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  const response = await axiosInstance.patch(
    API_ENDPOINTS.USER.UPDATE_PROFILE_IMAGE,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};