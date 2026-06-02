import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  approveAdminAppointmentApi,
  approveDoctorAppointmentApi,
  completeDoctorAppointmentApi,
  getAdminAppointmentDetailsApi,
  getAdminAppointmentsApi,
  getAppointmentDetailsApi,
  getDoctorAppointmentDetailsApi,
  getDoctorAppointmentsApi,
  getMyAppointmentDetailsApi,
  getMyAppointmentsApi,
  initiateAppointmentApi,
  markPaymentFailedApi,
  markPaymentSuccessApi,
  rejectAdminAppointmentApi,
  rejectDoctorAppointmentApi,
} from "./appointmentService";

const INITIATED_APPOINTMENT_KEY = "dentacare_initiated_appointment";
const BOOKING_DRAFT_KEY = "dentacare_booking_draft";

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

const clearStoredInitiatedAppointment = () => {
  sessionStorage.removeItem(INITIATED_APPOINTMENT_KEY);
};

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

const updateAppointmentInList = (list, updatedAppointment) => {
  if (!updatedAppointment?._id) return list;

  return list.map((appointment) =>
    appointment._id === updatedAppointment._id
      ? updatedAppointment
      : appointment
  );
};

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

export const confirmPaymentSuccess = createAsyncThunk(
  "appointments/confirmPaymentSuccess",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await markPaymentSuccessApi(payload);

      return {
        appointment: response.data?.appointment,
        payment: response.data?.payment,
        message:
          response.message ||
          "Payment successful. Appointment submitted for approval.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to confirm payment")
      );
    }
  }
);

export const confirmPaymentFailed = createAsyncThunk(
  "appointments/confirmPaymentFailed",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await markPaymentFailedApi(payload);

      return {
        appointment: response.data?.appointment,
        payment: response.data?.payment,
        message: response.message || "Payment failure recorded",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to record failed payment")
      );
    }
  }
);

export const fetchMyAppointments = createAsyncThunk(
  "appointments/fetchMyAppointments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getMyAppointmentsApi(params);

      return response.data || [];
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch my appointments")
      );
    }
  }
);

export const fetchMyAppointmentDetails = createAsyncThunk(
  "appointments/fetchMyAppointmentDetails",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await getMyAppointmentDetailsApi(appointmentId);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch appointment details")
      );
    }
  }
);

export const fetchDoctorAppointments = createAsyncThunk(
  "appointments/fetchDoctorAppointments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getDoctorAppointmentsApi(params);

      return response.data || [];
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch doctor appointments")
      );
    }
  }
);

export const fetchDoctorAppointmentDetails = createAsyncThunk(
  "appointments/fetchDoctorAppointmentDetails",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await getDoctorAppointmentDetailsApi(appointmentId);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch doctor appointment details")
      );
    }
  }
);

export const approveDoctorAppointment = createAsyncThunk(
  "appointments/approveDoctorAppointment",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await approveDoctorAppointmentApi(appointmentId);

      return {
        appointment: response.data,
        message: response.message || "Appointment approved successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to approve appointment")
      );
    }
  }
);

export const rejectDoctorAppointment = createAsyncThunk(
  "appointments/rejectDoctorAppointment",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await rejectDoctorAppointmentApi(payload);

      return {
        appointment: response.data,
        message: response.message || "Appointment rejected successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to reject appointment")
      );
    }
  }
);

export const completeDoctorAppointment = createAsyncThunk(
  "appointments/completeDoctorAppointment",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await completeDoctorAppointmentApi(appointmentId);

      return {
        appointment: response.data,
        message:
          response.message ||
          "Appointment marked as completed successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to complete appointment")
      );
    }
  }
);

export const fetchAdminAppointments = createAsyncThunk(
  "appointments/fetchAdminAppointments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminAppointmentsApi(params);

      return response.data || [];
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch admin appointments")
      );
    }
  }
);

export const fetchAdminAppointmentDetails = createAsyncThunk(
  "appointments/fetchAdminAppointmentDetails",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await getAdminAppointmentDetailsApi(appointmentId);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch admin appointment details")
      );
    }
  }
);

export const approveAdminAppointment = createAsyncThunk(
  "appointments/approveAdminAppointment",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await approveAdminAppointmentApi(appointmentId);

      return {
        appointment: response.data,
        message: response.message || "Appointment approved successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to approve appointment")
      );
    }
  }
);

export const rejectAdminAppointment = createAsyncThunk(
  "appointments/rejectAdminAppointment",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await rejectAdminAppointmentApi(payload);

      return {
        appointment: response.data,
        message: response.message || "Appointment rejected successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to reject appointment")
      );
    }
  }
);

const appointmentSlice = createSlice({
  name: "appointments",

  initialState: {
    bookingDraft: getStoredBookingDraft(),
    initiatedAppointment: getStoredInitiatedAppointment(),

    myAppointments: [],
    doctorAppointments: [],
    adminAppointments: [],

    selectedAppointment: null,
    latestPayment: null,

    selectedPaymentMethod: "google_pay",

    isInitiating: false,
    isLoadingDetails: false,
    isLoadingList: false,
    isPaying: false,
    isDeciding: false,
    isCompleting: false,

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

    clearAppointmentError: (state) => {
      state.error = null;
    },

    clearSelectedAppointment: (state) => {
      state.selectedAppointment = null;
    },

    clearInitiatedAppointment: (state) => {
      state.initiatedAppointment = null;
      clearStoredInitiatedAppointment();
    },
  },

  extraReducers: (builder) => {
    builder
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

      .addCase(fetchAppointmentDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.error = null;
      })

      .addCase(fetchAppointmentDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.initiatedAppointment = action.payload.appointment;
        state.selectedAppointment = action.payload.appointment;
        state.error = null;

        saveInitiatedAppointment(action.payload.appointment);
      })

      .addCase(fetchAppointmentDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.error = action.payload || "Failed to fetch appointment";
      })

      .addCase(confirmPaymentSuccess.pending, (state) => {
        state.isPaying = true;
        state.error = null;
      })

      .addCase(confirmPaymentSuccess.fulfilled, (state, action) => {
        state.isPaying = false;
        state.initiatedAppointment = action.payload.appointment;
        state.selectedAppointment = action.payload.appointment;
        state.latestPayment = action.payload.payment;
        state.error = null;

        saveInitiatedAppointment(action.payload.appointment);
        clearStoredBookingDraft();
        state.bookingDraft = null;
      })

      .addCase(confirmPaymentSuccess.rejected, (state, action) => {
        state.isPaying = false;
        state.error = action.payload || "Payment failed";
      })

      .addCase(confirmPaymentFailed.pending, (state) => {
        state.isPaying = true;
        state.error = null;
      })

      .addCase(confirmPaymentFailed.fulfilled, (state, action) => {
        state.isPaying = false;
        state.initiatedAppointment = action.payload.appointment;
        state.selectedAppointment = action.payload.appointment;
        state.latestPayment = action.payload.payment;
        state.error = null;

        saveInitiatedAppointment(action.payload.appointment);
      })

      .addCase(confirmPaymentFailed.rejected, (state, action) => {
        state.isPaying = false;
        state.error = action.payload || "Failed to record failed payment";
      })

      .addCase(fetchMyAppointments.pending, (state) => {
        state.isLoadingList = true;
        state.error = null;
      })

      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.isLoadingList = false;
        state.myAppointments = action.payload;
        state.error = null;
      })

      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.isLoadingList = false;
        state.error = action.payload;
      })

      .addCase(fetchMyAppointmentDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.error = null;
      })

      .addCase(fetchMyAppointmentDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.selectedAppointment = action.payload;
        state.error = null;
      })

      .addCase(fetchMyAppointmentDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.error = action.payload;
      })

      .addCase(fetchDoctorAppointments.pending, (state) => {
        state.isLoadingList = true;
        state.error = null;
      })

      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
        state.isLoadingList = false;
        state.doctorAppointments = action.payload;
        state.error = null;
      })

      .addCase(fetchDoctorAppointments.rejected, (state, action) => {
        state.isLoadingList = false;
        state.error = action.payload;
      })

      .addCase(fetchDoctorAppointmentDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.error = null;
      })

      .addCase(fetchDoctorAppointmentDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.selectedAppointment = action.payload;
        state.error = null;
      })

      .addCase(fetchDoctorAppointmentDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminAppointments.pending, (state) => {
        state.isLoadingList = true;
        state.error = null;
      })

      .addCase(fetchAdminAppointments.fulfilled, (state, action) => {
        state.isLoadingList = false;
        state.adminAppointments = action.payload;
        state.error = null;
      })

      .addCase(fetchAdminAppointments.rejected, (state, action) => {
        state.isLoadingList = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminAppointmentDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.error = null;
      })

      .addCase(fetchAdminAppointmentDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.selectedAppointment = action.payload;
        state.error = null;
      })

      .addCase(fetchAdminAppointmentDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.error = action.payload;
      })

      .addCase(approveDoctorAppointment.pending, (state) => {
        state.isDeciding = true;
        state.error = null;
      })

      .addCase(approveDoctorAppointment.fulfilled, (state, action) => {
        state.isDeciding = false;
        state.selectedAppointment = action.payload.appointment;
        state.doctorAppointments = updateAppointmentInList(
          state.doctorAppointments,
          action.payload.appointment
        );
        state.error = null;
      })

      .addCase(approveDoctorAppointment.rejected, (state, action) => {
        state.isDeciding = false;
        state.error = action.payload;
      })

      .addCase(rejectDoctorAppointment.pending, (state) => {
        state.isDeciding = true;
        state.error = null;
      })

      .addCase(rejectDoctorAppointment.fulfilled, (state, action) => {
        state.isDeciding = false;
        state.selectedAppointment = action.payload.appointment;
        state.doctorAppointments = updateAppointmentInList(
          state.doctorAppointments,
          action.payload.appointment
        );
        state.error = null;
      })

      .addCase(rejectDoctorAppointment.rejected, (state, action) => {
        state.isDeciding = false;
        state.error = action.payload;
      })

      .addCase(completeDoctorAppointment.pending, (state) => {
        state.isCompleting = true;
        state.error = null;
      })

      .addCase(completeDoctorAppointment.fulfilled, (state, action) => {
        state.isCompleting = false;
        state.selectedAppointment = action.payload.appointment;
        state.doctorAppointments = updateAppointmentInList(
          state.doctorAppointments,
          action.payload.appointment
        );
        state.error = null;
      })

      .addCase(completeDoctorAppointment.rejected, (state, action) => {
        state.isCompleting = false;
        state.error = action.payload;
      })

      .addCase(approveAdminAppointment.pending, (state) => {
        state.isDeciding = true;
        state.error = null;
      })

      .addCase(approveAdminAppointment.fulfilled, (state, action) => {
        state.isDeciding = false;
        state.selectedAppointment = action.payload.appointment;
        state.adminAppointments = updateAppointmentInList(
          state.adminAppointments,
          action.payload.appointment
        );
        state.error = null;
      })

      .addCase(approveAdminAppointment.rejected, (state, action) => {
        state.isDeciding = false;
        state.error = action.payload;
      })

      .addCase(rejectAdminAppointment.pending, (state) => {
        state.isDeciding = true;
        state.error = null;
      })

      .addCase(rejectAdminAppointment.fulfilled, (state, action) => {
        state.isDeciding = false;
        state.selectedAppointment = action.payload.appointment;
        state.adminAppointments = updateAppointmentInList(
          state.adminAppointments,
          action.payload.appointment
        );
        state.error = null;
      })

      .addCase(rejectAdminAppointment.rejected, (state, action) => {
        state.isDeciding = false;
        state.error = action.payload;
      });
  },
});

export const {
  setBookingDraft,
  clearBookingDraft,
  setSelectedPaymentMethod,
  clearAppointmentError,
  clearSelectedAppointment,
  clearInitiatedAppointment,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;