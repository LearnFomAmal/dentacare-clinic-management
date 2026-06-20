import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getHomeBannersApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.BANNER.HOME);
  return response.data;
};

export const getDoctorPageBannersApi = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.BANNER.DOCTORS);
  return response.data;
};

export const createBannerApi = async (formData) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.BANNER.ADMIN_CREATE,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getAdminBannersApi = async (params) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.BANNER.ADMIN_GET_ALL,
    {
      params,
    }
  );

  return response.data;
};

export const getAdminBannerDetailsApi = async (bannerId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.BANNER.ADMIN_GET_DETAILS(bannerId)
  );

  return response.data;
};

export const updateBannerApi = async ({ bannerId, formData }) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.BANNER.ADMIN_UPDATE(bannerId),
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const updateBannerStatusApi = async ({ bannerId, isActive }) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.BANNER.ADMIN_UPDATE_STATUS(bannerId),
    {
      isActive,
    }
  );

  return response.data;
};

export const deleteBannerApi = async (bannerId) => {
  const response = await axiosInstance.delete(
    API_ENDPOINTS.BANNER.ADMIN_DELETE(bannerId)
  );

  return response.data;
};