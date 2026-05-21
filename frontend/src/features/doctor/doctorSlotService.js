import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const getDoctorSlotsApi = async ({ startDate, days = 7 }) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.DOCTOR.SLOTS.GET_ALL,
    {
      params: {
        startDate,
        days,
      },
    }
  );

  return response.data;
};

export const addDoctorSlotApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.DOCTOR.SLOTS.ADD,
    payload
  );

  return response.data;
};

export const editDoctorSlotApi = async ({
  slotDayId,
  slotId,
  startTime,
  endTime,
}) => {
  const response = await axiosInstance.patch(
    API_ENDPOINTS.DOCTOR.SLOTS.UPDATE(slotDayId, slotId),
    {
      startTime,
      endTime,
    }
  );

  return response.data;
};

export const deleteDoctorSlotApi = async ({ slotDayId, slotId }) => {
  const response = await axiosInstance.delete(
    API_ENDPOINTS.DOCTOR.SLOTS.DELETE(slotDayId, slotId)
  );

  return response.data;
};

export const applyRecurringSlotsApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.DOCTOR.SLOTS.APPLY_RECURRING,
    payload
  );

  return response.data;
};