import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

const getRoleEndpoints = (role) => {
  if (role === "doctor") {
    return {
      myChats: API_ENDPOINTS.CHAT.DOCTOR_MY,
      messages: API_ENDPOINTS.CHAT.DOCTOR_MESSAGES,
      sendMessage: API_ENDPOINTS.CHAT.DOCTOR_SEND_MESSAGE,
      markRead: API_ENDPOINTS.CHAT.DOCTOR_MARK_READ,
    };
  }

  return {
    myChats: API_ENDPOINTS.CHAT.PATIENT_MY,
    messages: API_ENDPOINTS.CHAT.PATIENT_MESSAGES,
    sendMessage: API_ENDPOINTS.CHAT.PATIENT_SEND_MESSAGE,
    markRead: API_ENDPOINTS.CHAT.PATIENT_MARK_READ,
  };
};

export const getMyChatsApi = async ({ role, params }) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.get(endpoints.myChats, {
    params,
  });

  return response.data;
};

export const getAppointmentMessagesApi = async ({
  role,
  appointmentId,
  params,
}) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.get(endpoints.messages(appointmentId), {
    params,
  });

  return response.data;
};

export const sendChatMessageApi = async ({ role, appointmentId, text }) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.post(
    endpoints.sendMessage(appointmentId),
    {
      text,
    }
  );

  return response.data;
};

export const markChatReadApi = async ({ role, chatId }) => {
  const endpoints = getRoleEndpoints(role);

  const response = await axiosInstance.patch(endpoints.markRead(chatId));

  return response.data;
};