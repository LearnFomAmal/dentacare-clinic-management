import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  deleteDraftReportApi,
  getDraftReportsApi,
  uploadBookingReportApi,
} from "./reportService";

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

      return response.data || [];
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

const reportSlice = createSlice({
  name: "reports",

  initialState: {
    draftReports: [],
    isUploading: false,
    isLoading: false,
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
      });
  },
});

export const {
  clearReportError,
  clearDraftReports,
} = reportSlice.actions;

export default reportSlice.reducer;