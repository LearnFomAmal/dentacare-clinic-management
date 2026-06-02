import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

export const uploadBookingReportApi = async (formData) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.REPORT.BOOKING_UPLOAD,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getDraftReportsApi = async () => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REPORT.DRAFTS
  );

  return response.data;
};

export const deleteDraftReportApi = async (reportId) => {
  const response = await axiosInstance.delete(
    API_ENDPOINTS.REPORT.DELETE_DRAFT(reportId)
  );

  return response.data;
};

export const uploadDoctorPrescriptionApi = async ({
  appointmentId,
  formData,
}) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.REPORT.DOCTOR_UPLOAD_PRESCRIPTION(appointmentId),
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getPatientAppointmentReportsApi = async (appointmentId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REPORT.PATIENT_APPOINTMENT_REPORTS(appointmentId)
  );

  return response.data;
};

export const getDoctorAppointmentReportsApi = async (appointmentId) => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.REPORT.DOCTOR_APPOINTMENT_REPORTS(appointmentId)
  );

  return response.data;
};