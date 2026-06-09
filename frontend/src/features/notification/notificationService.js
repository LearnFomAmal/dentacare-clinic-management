import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

const getRoleEndpoints = (role) => {
  if (role === "doctor") {
    return {
      list: API_ENDPOINTS.NOTIFICATION.DOCTOR_LIST,
      unreadCount: API_ENDPOINTS.NOTIFICATION.DOCTOR_UNREAD_COUNT,
      markRead: API_ENDPOINTS.NOTIFICATION.DOCTOR_MARK_READ,
      markAllRead: API_ENDPOINTS.NOTIFICATION.DOCTOR_MARK_ALL_READ,
      delete: API_ENDPOINTS.NOTIFICATION.DOCTOR_DELETE,
    };
  }

  if (role === "admin") {
    return {
      list: API_ENDPOINTS.NOTIFICATION.ADMIN_LIST,
      unreadCount: API_ENDPOINTS.NOTIFICATION.ADMIN_UNREAD_COUNT,
      markRead: API_ENDPOINTS.NOTIFICATION.ADMIN_MARK_READ,
      markAllRead: API_ENDPOINTS.NOTIFICATION.ADMIN_MARK_ALL_READ,
      delete: API_ENDPOINTS.NOTIFICATION.ADMIN_DELETE,
    };
  }

  return {
    list: API_ENDPOINTS.NOTIFICATION.PATIENT_LIST,
    unreadCount: API_ENDPOINTS.NOTIFICATION.PATIENT_UNREAD_COUNT,
    markRead: API_ENDPOINTS.NOTIFICATION.PATIENT_MARK_READ,
    markAllRead: API_ENDPOINTS.NOTIFICATION.PATIENT_MARK_ALL_READ,
    delete: API_ENDPOINTS.NOTIFICATION.PATIENT_DELETE,
  };
};

export const getNotificationsApi = async ({ role, params }) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.get(endpoints.list, {
    params,
  });

  return response.data;
};

export const getUnreadNotificationCountApi = async (role) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.get(endpoints.unreadCount);

  return response.data;
};

export const markNotificationReadApi = async ({ role, notificationId }) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.patch(
    endpoints.markRead(notificationId)
  );

  return response.data;
};

export const markAllNotificationsReadApi = async (role) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.patch(endpoints.markAllRead);

  return response.data;
};

export const deleteNotificationApi = async ({ role, notificationId }) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.delete(
    endpoints.delete(notificationId)
  );

  return response.data;
};