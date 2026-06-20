import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  deleteDraftReportApi,
  getDoctorAppointmentReportsApi,
  getDraftReportsApi,
  getPatientAppointmentReportsApi,
  uploadBookingReportApi,
  uploadDoctorPrescriptionApi,
} from "./reportService";
const normalizeList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
};
const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

export const uploadBookingReport = createAsyncThunk(
  "reports/uploadBookingReport",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await uploadBookingReportApi(formData);

      return {
        report: response.data,
        message: response.message || "Report uploaded successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to upload report")
      );
    }
  }
);

export const fetchDraftReports = createAsyncThunk(
  "reports/fetchDraftReports",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDraftReportsApi();

      return normalizeList(response.data, "reports");
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch reports")
      );
    }
  }
);

export const deleteDraftReport = createAsyncThunk(
  "reports/deleteDraftReport",
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await deleteDraftReportApi(reportId);

      return {
        reportId,
        message: response.message || "Report deleted successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete report")
      );
    }
  }
);

export const uploadDoctorPrescription = createAsyncThunk(
  "reports/uploadDoctorPrescription",
  async ({ appointmentId, formData }, { rejectWithValue }) => {
    try {
      const response = await uploadDoctorPrescriptionApi({
        appointmentId,
        formData,
      });

      return {
        report: response.data,
        message: response.message || "Prescription uploaded successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to upload prescription")
      );
    }
  }
);

export const fetchPatientAppointmentReports = createAsyncThunk(
  "reports/fetchPatientAppointmentReports",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await getPatientAppointmentReportsApi(appointmentId);

     return normalizeList(response.data, "reports"); 
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch appointment reports")
      );
    }
  }
);

export const fetchDoctorAppointmentReports = createAsyncThunk(
  "reports/fetchDoctorAppointmentReports",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await getDoctorAppointmentReportsApi(appointmentId);

      return normalizeList(response.data, "reports");
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch appointment reports")
      );
    }
  }
);

const reportSlice = createSlice({
  name: "reports",

  initialState: {
    draftReports: [],
    appointmentReports: [],

    isUploading: false,
    isUploadingPrescription: false,
    isLoading: false,
    isLoadingAppointmentReports: false,
    isDeleting: false,

    error: null,
  },

  reducers: {
    clearReportError: (state) => {
      state.error = null;
    },

    clearDraftReports: (state) => {
      state.draftReports = [];
    },

    clearAppointmentReports: (state) => {
      state.appointmentReports = [];
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(uploadBookingReport.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })

      .addCase(uploadBookingReport.fulfilled, (state, action) => {
        state.isUploading = false;
        state.draftReports.unshift(action.payload.report);
        state.error = null;
      })

      .addCase(uploadBookingReport.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload;
      })

      .addCase(fetchDraftReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchDraftReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.draftReports = action.payload;
        state.error = null;
      })

      .addCase(fetchDraftReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteDraftReport.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })

      .addCase(deleteDraftReport.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.draftReports = state.draftReports.filter(
          (report) => report._id !== action.payload.reportId
        );
        state.error = null;
      })

      .addCase(deleteDraftReport.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })

      .addCase(uploadDoctorPrescription.pending, (state) => {
        state.isUploadingPrescription = true;
        state.error = null;
      })

      .addCase(uploadDoctorPrescription.fulfilled, (state, action) => {
        state.isUploadingPrescription = false;
        state.appointmentReports.unshift(action.payload.report);
        state.error = null;
      })

      .addCase(uploadDoctorPrescription.rejected, (state, action) => {
        state.isUploadingPrescription = false;
        state.error = action.payload;
      })

      .addCase(fetchPatientAppointmentReports.pending, (state) => {
        state.isLoadingAppointmentReports = true;
        state.error = null;
      })

      .addCase(fetchPatientAppointmentReports.fulfilled, (state, action) => {
        state.isLoadingAppointmentReports = false;
        state.appointmentReports = action.payload;
        state.error = null;
      })

      .addCase(fetchPatientAppointmentReports.rejected, (state, action) => {
        state.isLoadingAppointmentReports = false;
        state.error = action.payload;
      })

      .addCase(fetchDoctorAppointmentReports.pending, (state) => {
        state.isLoadingAppointmentReports = true;
        state.error = null;
      })

      .addCase(fetchDoctorAppointmentReports.fulfilled, (state, action) => {
        state.isLoadingAppointmentReports = false;
        state.appointmentReports = action.payload;
        state.error = null;
      })

      .addCase(fetchDoctorAppointmentReports.rejected, (state, action) => {
        state.isLoadingAppointmentReports = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearReportError,
  clearDraftReports,
  clearAppointmentReports,
} = reportSlice.actions;

export default reportSlice.reducer;