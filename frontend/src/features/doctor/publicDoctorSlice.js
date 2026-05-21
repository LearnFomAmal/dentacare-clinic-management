import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getPublicDoctorAvailableSlotsApi,
  getPublicDoctorDetailsApi,
  getPublicDoctorsApi,
  getPublicSpecialtiesApi,
} from "./publicDoctorService";

const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

export const fetchPublicSpecialties = createAsyncThunk(
  "publicDoctors/fetchPublicSpecialties",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getPublicSpecialtiesApi();

      return response.data || [];
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch specialties")
      );
    }
  }
);

export const fetchPublicDoctors = createAsyncThunk(
  "publicDoctors/fetchPublicDoctors",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().publicDoctors;

      const response = await getPublicDoctorsApi({
        search: filters.search,
        specialtyId: filters.specialtyId,
        minExperience: filters.minExperience,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch doctors")
      );
    }
  }
);

export const fetchPublicDoctorDetails = createAsyncThunk(
  "publicDoctors/fetchPublicDoctorDetails",
  async (doctorId, { rejectWithValue }) => {
    try {
      const response = await getPublicDoctorDetailsApi(doctorId);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch doctor details")
      );
    }
  }
);

export const fetchDoctorAvailableSlots = createAsyncThunk(
  "publicDoctors/fetchDoctorAvailableSlots",
  async ({ doctorId, date }, { rejectWithValue }) => {
    try {
      const response = await getPublicDoctorAvailableSlotsApi({
        doctorId,
        date,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch available slots")
      );
    }
  }
);

const publicDoctorSlice = createSlice({
  name: "publicDoctors",

  initialState: {
    doctors: [],
    specialties: [],
    selectedDoctor: null,
    availableSlotData: null,

    selectedDate: getTodayDateString(),
    selectedSlotsByDoctor: {},

    filters: {
      search: "",
      specialtyId: "",
      minExperience: "",
      sort: "latest",
      page: 1,
      limit: 9,
    },

    pagination: {
      page: 1,
      limit: 9,
      totalDoctors: 0,
      totalPages: 1,
    },

    isLoadingDoctors: false,
    isLoadingSpecialties: false,
    isLoadingDetails: false,
    isLoadingSlots: false,
    error: null,
  },

  reducers: {
    setDoctorFilter: (state, action) => {
      const { name, value } = action.payload;

      state.filters[name] = value;
      state.filters.page = 1;
    },

    resetDoctorFilters: (state) => {
      state.filters = {
        search: "",
        specialtyId: "",
        minExperience: "",
        sort: "latest",
        page: 1,
        limit: 9,
      };
    },

    setDoctorPage: (state, action) => {
      state.filters.page = action.payload;
    },

    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
      state.selectedSlotsByDoctor = {};
    },

    setSelectedDoctorSlot: (state, action) => {
      const { doctorId, slot } = action.payload;

      state.selectedSlotsByDoctor[doctorId] = slot;
    },

    clearSelectedDoctorSlot: (state, action) => {
      delete state.selectedSlotsByDoctor[action.payload];
    },

    clearPublicDoctorError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicSpecialties.pending, (state) => {
        state.isLoadingSpecialties = true;
        state.error = null;
      })

      .addCase(fetchPublicSpecialties.fulfilled, (state, action) => {
        state.isLoadingSpecialties = false;
        state.specialties = action.payload;
      })

      .addCase(fetchPublicSpecialties.rejected, (state, action) => {
        state.isLoadingSpecialties = false;
        state.error = action.payload;
      })

      .addCase(fetchPublicDoctors.pending, (state) => {
        state.isLoadingDoctors = true;
        state.error = null;
      })

      .addCase(fetchPublicDoctors.fulfilled, (state, action) => {
        state.isLoadingDoctors = false;
        state.doctors = action.payload?.doctors || [];
        state.pagination =
          action.payload?.pagination || state.pagination;
      })

      .addCase(fetchPublicDoctors.rejected, (state, action) => {
        state.isLoadingDoctors = false;
        state.error = action.payload;
      })

      .addCase(fetchPublicDoctorDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.error = null;
        state.selectedDoctor = null;
      })

      .addCase(fetchPublicDoctorDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.selectedDoctor = action.payload;
      })

      .addCase(fetchPublicDoctorDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.error = action.payload;
      })

      .addCase(fetchDoctorAvailableSlots.pending, (state) => {
        state.isLoadingSlots = true;
        state.error = null;
        state.availableSlotData = null;
      })

      .addCase(fetchDoctorAvailableSlots.fulfilled, (state, action) => {
        state.isLoadingSlots = false;
        state.availableSlotData = action.payload;
      })

      .addCase(fetchDoctorAvailableSlots.rejected, (state, action) => {
        state.isLoadingSlots = false;
        state.error = action.payload;
      });
  },
});

export const {
  setDoctorFilter,
  resetDoctorFilters,
  setDoctorPage,
  setSelectedDate,
  setSelectedDoctorSlot,
  clearSelectedDoctorSlot,
  clearPublicDoctorError,
} = publicDoctorSlice.actions;

export default publicDoctorSlice.reducer;