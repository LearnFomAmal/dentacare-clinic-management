import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  addDoctorSlotApi,
  applyRecurringSlotsApi,
  deleteDoctorSlotApi,
  editDoctorSlotApi,
  getDoctorSlotsApi,
} from "./doctorSlotService";

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

export const fetchDoctorSlots = createAsyncThunk(
  "doctorSlots/fetchDoctorSlots",
  async ({ startDate = getTodayDateString(), days = 7 } = {}, { rejectWithValue }) => {
    try {
      const response = await getDoctorSlotsApi({
        startDate,
        days,
      });

      return {
        slots: response.data || [],
        message: response.message,
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch doctor slots")
      );
    }
  }
);

export const addDoctorSlot = createAsyncThunk(
  "doctorSlots/addDoctorSlot",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await addDoctorSlotApi(payload);

      return {
        slotDay: response.data,
        message: response.message || "Slot added successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to add slot")
      );
    }
  }
);

export const editDoctorSlot = createAsyncThunk(
  "doctorSlots/editDoctorSlot",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await editDoctorSlotApi(payload);

      return {
        slotDay: response.data,
        message: response.message || "Slot updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update slot")
      );
    }
  }
);

export const deleteDoctorSlot = createAsyncThunk(
  "doctorSlots/deleteDoctorSlot",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await deleteDoctorSlotApi(payload);

      return {
        slotDay: response.data,
        message: response.message || "Slot deleted successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete slot")
      );
    }
  }
);

export const applyRecurringSlots = createAsyncThunk(
  "doctorSlots/applyRecurringSlots",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await applyRecurringSlotsApi(payload);

      return {
        result: response.data,
        message: response.message || "Recurring slots applied successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to apply recurring slots")
      );
    }
  }
);

const doctorSlotSlice = createSlice({
  name: "doctorSlots",
  initialState: {
    slotDays: [],
    selectedDate: null,
    startDate: getTodayDateString(),
    days: 7,
    isLoading: false,
    isMutating: false,
    error: null,
    recurringResult: null,
  },

  reducers: {
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },

    setStartDate: (state, action) => {
      state.startDate = action.payload;
    },

    clearDoctorSlotError: (state) => {
      state.error = null;
    },

    clearRecurringResult: (state) => {
      state.recurringResult = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorSlots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchDoctorSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.slotDays = action.payload.slots;

        if (!state.selectedDate && action.payload.slots.length > 0) {
          state.selectedDate = action.payload.slots[0].date;
        }

        if (
          state.selectedDate &&
          !action.payload.slots.some(
            (slotDay) => slotDay.date === state.selectedDate
          )
        ) {
          state.selectedDate = action.payload.slots[0]?.date || null;
        }

        state.error = null;
      })

      .addCase(fetchDoctorSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(addDoctorSlot.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })

      .addCase(addDoctorSlot.fulfilled, (state, action) => {
        state.isMutating = false;

        const updatedSlotDay = action.payload.slotDay;

        state.slotDays = state.slotDays.map((slotDay) =>
          slotDay._id === updatedSlotDay._id ? updatedSlotDay : slotDay
        );

        state.selectedDate = updatedSlotDay.date;
        state.error = null;
      })

      .addCase(addDoctorSlot.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })

      .addCase(editDoctorSlot.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })

      .addCase(editDoctorSlot.fulfilled, (state, action) => {
        state.isMutating = false;

        const updatedSlotDay = action.payload.slotDay;

        state.slotDays = state.slotDays.map((slotDay) =>
          slotDay._id === updatedSlotDay._id ? updatedSlotDay : slotDay
        );

        state.selectedDate = updatedSlotDay.date;
        state.error = null;
      })

      .addCase(editDoctorSlot.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })

      .addCase(deleteDoctorSlot.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })

      .addCase(deleteDoctorSlot.fulfilled, (state, action) => {
        state.isMutating = false;

        const updatedSlotDay = action.payload.slotDay;

        state.slotDays = state.slotDays.map((slotDay) =>
          slotDay._id === updatedSlotDay._id ? updatedSlotDay : slotDay
        );

        state.selectedDate = updatedSlotDay.date;
        state.error = null;
      })

      .addCase(deleteDoctorSlot.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })

      .addCase(applyRecurringSlots.pending, (state) => {
        state.isMutating = true;
        state.error = null;
        state.recurringResult = null;
      })

      .addCase(applyRecurringSlots.fulfilled, (state, action) => {
        state.isMutating = false;
        state.recurringResult = action.payload.result;
        state.error = null;
      })

      .addCase(applyRecurringSlots.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedDate,
  setStartDate,
  clearDoctorSlotError,
  clearRecurringResult,
} = doctorSlotSlice.actions;

export default doctorSlotSlice.reducer;