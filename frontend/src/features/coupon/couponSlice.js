import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createCouponApi,
  deleteCouponApi,
  getAdminCouponDetailsApi,
  getAdminCouponsApi,
  getAvailableCouponsApi,
  updateCouponApi,
  updateCouponStatusApi,
  validateCouponApi,
} from "./couponService";
const normalizeCouponList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.coupons)) return data.coupons;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};
const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchAvailableCoupons = createAsyncThunk(
  "coupons/fetchAvailableCoupons",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAvailableCouponsApi(params);
      return normalizeCouponList(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch coupons"));
    }
  }
);

export const validateCoupon = createAsyncThunk(
  "coupons/validateCoupon",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await validateCouponApi(payload);

      return {
        data: response.data,
        message: response.message || "Coupon applied successfully",
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to apply coupon"));
    }
  }
);

export const createCoupon = createAsyncThunk(
  "coupons/createCoupon",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createCouponApi(payload);

      return {
        coupon: response.data,
        message: response.message || "Coupon created successfully",
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to create coupon"));
    }
  }
);

export const fetchAdminCoupons = createAsyncThunk(
  "coupons/fetchAdminCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminCouponsApi(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch coupons"));
    }
  }
);

export const fetchAdminCouponDetails = createAsyncThunk(
  "coupons/fetchAdminCouponDetails",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await getAdminCouponDetailsApi(couponId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch coupon details")
      );
    }
  }
);

export const updateCoupon = createAsyncThunk(
  "coupons/updateCoupon",
  async ({ couponId, payload }, { rejectWithValue }) => {
    try {
      const response = await updateCouponApi({ couponId, payload });

      return {
        coupon: response.data,
        message: response.message || "Coupon updated successfully",
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update coupon"));
    }
  }
);

export const updateCouponStatus = createAsyncThunk(
  "coupons/updateCouponStatus",
  async ({ couponId, isActive }, { rejectWithValue }) => {
    try {
      const response = await updateCouponStatusApi({
        couponId,
        isActive,
      });

      return {
        coupon: response.data,
        message: response.message || "Coupon status updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update coupon status")
      );
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  "coupons/deleteCoupon",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await deleteCouponApi(couponId);

      return {
        couponId,
        message: response.message || "Coupon deleted successfully",
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete coupon"));
    }
  }
);

const couponSlice = createSlice({
  name: "coupons",

  initialState: {
    availableCoupons: [],
    adminCoupons: [],
    selectedCoupon: null,
    appliedCoupon: null,
    couponPreview: null,

    pagination: null,

    isLoading: false,
    isValidating: false,
    isSaving: false,
    isDeleting: false,

    error: null,
  },

  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    },

    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null;
      state.couponPreview = null;
    },

    clearSelectedCoupon: (state) => {
      state.selectedCoupon = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableCoupons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableCoupons = action.payload;
        state.error = null;
      })

      .addCase(fetchAvailableCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(validateCoupon.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })

      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.isValidating = false;
        state.appliedCoupon = action.payload.data?.coupon || null;
        state.couponPreview = action.payload.data || null;
        state.error = null;
      })

      .addCase(validateCoupon.rejected, (state, action) => {
        state.isValidating = false;
        state.appliedCoupon = null;
        state.couponPreview = null;
        state.error = action.payload;
      })

      .addCase(createCoupon.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(createCoupon.fulfilled, (state, action) => {
        state.isSaving = false;
        state.adminCoupons.unshift(action.payload.coupon);
        state.error = null;
      })

      .addCase(createCoupon.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminCoupons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchAdminCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminCoupons = action.payload?.coupons || [];
        state.pagination = action.payload?.pagination || null;
        state.error = null;
      })

      .addCase(fetchAdminCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminCouponDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchAdminCouponDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCoupon = action.payload;
        state.error = null;
      })

      .addCase(fetchAdminCouponDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(updateCoupon.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.isSaving = false;
        state.selectedCoupon = action.payload.coupon;
        state.adminCoupons = state.adminCoupons.map((coupon) =>
          coupon._id === action.payload.coupon._id
            ? action.payload.coupon
            : coupon
        );
        state.error = null;
      })

      .addCase(updateCoupon.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(updateCouponStatus.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(updateCouponStatus.fulfilled, (state, action) => {
        state.isSaving = false;

        state.adminCoupons = state.adminCoupons.map((coupon) =>
          coupon._id === action.payload.coupon._id
            ? action.payload.coupon
            : coupon
        );

        if (state.selectedCoupon?._id === action.payload.coupon._id) {
          state.selectedCoupon = action.payload.coupon;
        }

        state.error = null;
      })

      .addCase(updateCouponStatus.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload || "Failed to update coupon status";
      })

      .addCase(deleteCoupon.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })

      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.adminCoupons = state.adminCoupons.filter(
          (coupon) => coupon._id !== action.payload.couponId
        );
        state.error = null;
      })

      .addCase(deleteCoupon.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCouponError,
  clearAppliedCoupon,
  clearSelectedCoupon,
} = couponSlice.actions;

export default couponSlice.reducer;