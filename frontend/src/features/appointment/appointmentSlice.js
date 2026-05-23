import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getAppointmentDetailsApi,
  initiateAppointmentApi,
} from "./appointmentService";

const INITIATED_APPOINTMENT_KEY = "dentacare_initiated_appointment";
const BOOKING_DRAFT_KEY = "dentacare_booking_draft";

// ==============================
// SESSION STORAGE HELPERS
// ==============================
const safeJsonParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getStoredInitiatedAppointment = () => {
  const data = safeJsonParse(
    sessionStorage.getItem(INITIATED_APPOINTMENT_KEY)
  );

  if (!data) {
    sessionStorage.removeItem(INITIATED_APPOINTMENT_KEY);
    return null;
  }

  return data;
};

const saveInitiatedAppointment = (appointment) => {
  if (!appointment) return;

  sessionStorage.setItem(
    INITIATED_APPOINTMENT_KEY,
    JSON.stringify(appointment)
  );
};

const clearStoredInitiatedAppointment = () => {
  sessionStorage.removeItem(INITIATED_APPOINTMENT_KEY);
};

const getStoredBookingDraft = () => {
  const data = safeJsonParse(sessionStorage.getItem(BOOKING_DRAFT_KEY));

  if (!data) {
    sessionStorage.removeItem(BOOKING_DRAFT_KEY);
    return null;
  }

  return data;
};

const saveStoredBookingDraft = (draft) => {
  if (!draft) return;

  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
};

const clearStoredBookingDraft = () => {
  sessionStorage.removeItem(BOOKING_DRAFT_KEY);
};

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

// ==============================
// THUNKS
// ==============================
export const initiateAppointment = createAsyncThunk(
  "appointments/initiateAppointment",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await initiateAppointmentApi(payload);

      return {
        appointment: response.data,
        message: response.message || "Appointment initiated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to initiate appointment")
      );
    }
  }
);

export const fetchAppointmentDetails = createAsyncThunk(
  "appointments/fetchAppointmentDetails",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await getAppointmentDetailsApi(appointmentId);

      return {
        appointment: response.data,
        message: response.message || "Appointment fetched successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch appointment")
      );
    }
  }
);

// ==============================
// SLICE
// ==============================
const appointmentSlice = createSlice({
  name: "appointments",

  initialState: {
    bookingDraft: getStoredBookingDraft(),
    initiatedAppointment: getStoredInitiatedAppointment(),

    selectedPaymentMethod: "google_pay",
    couponCode: "",

    isInitiating: false,
    isLoadingDetails: false,
    error: null,
  },

  reducers: {
    setBookingDraft: (state, action) => {
      state.bookingDraft = action.payload;
      saveStoredBookingDraft(action.payload);
    },

    clearBookingDraft: (state) => {
      state.bookingDraft = null;
      clearStoredBookingDraft();
    },

    setSelectedPaymentMethod: (state, action) => {
      state.selectedPaymentMethod = action.payload;
    },

    setCouponCode: (state, action) => {
      state.couponCode = action.payload;
    },

    clearAppointmentError: (state) => {
      state.error = null;
    },

    clearInitiatedAppointment: (state) => {
      state.initiatedAppointment = null;
      clearStoredInitiatedAppointment();
    },
  },

  extraReducers: (builder) => {
    builder
      // INITIATE APPOINTMENT
      .addCase(initiateAppointment.pending, (state) => {
        state.isInitiating = true;
        state.error = null;
      })

      .addCase(initiateAppointment.fulfilled, (state, action) => {
        state.isInitiating = false;
        state.initiatedAppointment = action.payload.appointment;
        state.error = null;

        saveInitiatedAppointment(action.payload.appointment);
      })

      .addCase(initiateAppointment.rejected, (state, action) => {
        state.isInitiating = false;
        state.error = action.payload || "Failed to initiate appointment";
      })

      // FETCH APPOINTMENT DETAILS
      .addCase(fetchAppointmentDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.error = null;
      })

      .addCase(fetchAppointmentDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.initiatedAppointment = action.payload.appointment;
        state.error = null;

        saveInitiatedAppointment(action.payload.appointment);
      })

      .addCase(fetchAppointmentDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.error = action.payload || "Failed to fetch appointment";
      });
  },
});

export const {
  setBookingDraft,
  clearBookingDraft,
  setSelectedPaymentMethod,
  setCouponCode,
  clearAppointmentError,
  clearInitiatedAppointment,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;