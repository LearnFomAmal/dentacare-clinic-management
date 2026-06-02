import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const initiateAppointmentApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.APPOINTMENT.INITIATE,
    payload
  );

  return response.data;
};

export const getAppointmentDetailsApi = async (appointmentId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.APPOINTMENT.DETAILS(appointmentId)
  );

  return response.data;
};

export const markPaymentSuccessApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.PAYMENT.SUCCESS,
    payload
  );

  return response.data;
};

export const markPaymentFailedApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.PAYMENT.FAILED,
    payload
  );

  return response.data;
};

export const getMyAppointmentsApi = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.APPOINTMENT.MY, {
    params,
  });

  return response.data;
};

export const getMyAppointmentDetailsApi = async (appointmentId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.APPOINTMENT.MY_DETAILS(appointmentId)
  );

  return response.data;
};

export const getDoctorAppointmentsApi = async (params) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.APPOINTMENT.DOCTOR_LIST,
    {
      params,
    }
  );

  return response.data;
};

export const getDoctorAppointmentDetailsApi = async (appointmentId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.APPOINTMENT.DOCTOR_DETAILS(appointmentId)
  );

  return response.data;
};

export const approveDoctorAppointmentApi = async (appointmentId) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.APPOINTMENT.DOCTOR_APPROVE(appointmentId)
  );

  return response.data;
};

export const rejectDoctorAppointmentApi = async ({
  appointmentId,
  reasonType,
  reason,
}) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.APPOINTMENT.DOCTOR_REJECT(appointmentId),
    {
      reasonType,
      reason,
    }
  );

  return response.data;
};

export const completeDoctorAppointmentApi = async (appointmentId) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.APPOINTMENT.DOCTOR_COMPLETE(appointmentId)
  );

  return response.data;
};

export const getAdminAppointmentsApi = async (params) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.APPOINTMENT.ADMIN_LIST,
    {
      params,
    }
  );

  return response.data;
};

export const getAdminAppointmentDetailsApi = async (appointmentId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.APPOINTMENT.ADMIN_DETAILS(appointmentId)
  );

  return response.data;
};

export const approveAdminAppointmentApi = async (appointmentId) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.APPOINTMENT.ADMIN_APPROVE(appointmentId)
  );

  return response.data;
};

export const rejectAdminAppointmentApi = async ({
  appointmentId,
  reasonType,
  reason,
}) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.APPOINTMENT.ADMIN_REJECT(appointmentId),
    {
      reasonType,
      reason,
    }
  );

  return response.data;
};