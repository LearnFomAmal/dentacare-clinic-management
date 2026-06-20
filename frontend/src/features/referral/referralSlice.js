import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getAdminReferralsApi,
  getMyReferralApi,
  getMyReferralHistoryApi,
  getReferralConfigApi,
  updateReferralConfigApi,
} from "./referralService";
const normalizeReferralHistory = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.referrals)) return data.referrals;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};
const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchMyReferral = createAsyncThunk(
  "referrals/fetchMyReferral",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyReferralApi();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch referral details")
      );
    }
  }
);

export const fetchMyReferralHistory = createAsyncThunk(
  "referrals/fetchMyReferralHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyReferralHistoryApi();
      return normalizeReferralHistory(response.data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch referral history")
      );
    }
  }
);

export const fetchAdminReferrals = createAsyncThunk(
  "referrals/fetchAdminReferrals",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminReferralsApi(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch admin referrals")
      );
    }
  }
);

export const fetchReferralConfig = createAsyncThunk(
  "referrals/fetchReferralConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getReferralConfigApi();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch referral config")
      );
    }
  }
);

export const updateReferralConfig = createAsyncThunk(
  "referrals/updateReferralConfig",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await updateReferralConfigApi(payload);

      return {
        config: response.data,
        message: response.message || "Referral config updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update referral config")
      );
    }
  }
);

const referralSlice = createSlice({
  name: "referrals",

  initialState: {
    myReferral: null,
    myReferralHistory: [],

    adminReferrals: [],
    adminPagination: null,

    config: null,

    isLoading: false,
    isLoadingHistory: false,
    isSaving: false,

    error: null,
  },

  reducers: {
    clearReferralError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMyReferral.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchMyReferral.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myReferral = action.payload;
        state.error = null;
      })

      .addCase(fetchMyReferral.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchMyReferralHistory.pending, (state) => {
        state.isLoadingHistory = true;
        state.error = null;
      })

      .addCase(fetchMyReferralHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.myReferralHistory = action.payload;
        state.error = null;
      })

      .addCase(fetchMyReferralHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminReferrals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchAdminReferrals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminReferrals = action.payload?.referrals || [];
        state.adminPagination = action.payload?.pagination || null;
        state.error = null;
      })

      .addCase(fetchAdminReferrals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchReferralConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchReferralConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
        state.error = null;
      })

      .addCase(fetchReferralConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(updateReferralConfig.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(updateReferralConfig.fulfilled, (state, action) => {
        state.isSaving = false;
        state.config = action.payload.config;
        state.error = null;
      })

      .addCase(updateReferralConfig.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export const { clearReferralError } = referralSlice.actions;

export default referralSlice.reducer;