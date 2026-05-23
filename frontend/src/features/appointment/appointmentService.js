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