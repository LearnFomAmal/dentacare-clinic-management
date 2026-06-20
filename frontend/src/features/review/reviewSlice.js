import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  approveReviewApi,
  createReviewApi,
  deleteMyReviewApi,
  getAdminReviewDetailsApi,
  getAdminReviewsApi,
  getDoctorOwnReviewsApi,
  getMyReviewDetailsApi,
  getMyReviewsApi,
  getPublicDoctorReviewSummaryApi,
  getPublicDoctorReviewsApi,
  rejectReviewApi,
  updateMyReviewApi,
} from "./reviewService";
const normalizeListResponse = (data, key) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.[key])) return data[key];

  if (Array.isArray(data?.data)) return data.data;

  if (Array.isArray(data?.data?.[key])) return data.data[key];

  return [];
};

const normalizePaginatedResponse = (data, key) => {
  return {
    items: normalizeListResponse(data, key),
    pagination: data?.pagination || data?.data?.pagination || null,
    summary: data?.summary || data?.data?.summary || null,
  };
};
const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const createReview = createAsyncThunk(
  "reviews/createReview",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createReviewApi(payload);

      return {
        review: response.data,
        message:
          response.message ||
          "Review submitted successfully. It will be visible after approval.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to submit review")
      );
    }
  }
);

export const fetchMyReviews = createAsyncThunk(
  "reviews/fetchMyReviews",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getMyReviewsApi(params);
     return normalizePaginatedResponse(response.data, "reviews");
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch my reviews")
      );
    }
  }
);

export const fetchMyReviewDetails = createAsyncThunk(
  "reviews/fetchMyReviewDetails",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await getMyReviewDetailsApi(reviewId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch review details")
      );
    }
  }
);

export const updateMyReview = createAsyncThunk(
  "reviews/updateMyReview",
  async ({ reviewId, payload }, { rejectWithValue }) => {
    try {
      const response = await updateMyReviewApi({
        reviewId,
        payload,
      });

      return {
        review: response.data,
        message:
          response.message ||
          "Review updated successfully. It will be visible after approval.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update review")
      );
    }
  }
);

export const deleteMyReview = createAsyncThunk(
  "reviews/deleteMyReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await deleteMyReviewApi(reviewId);

      return {
        reviewId,
        message: response.message || "Review deleted successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete review")
      );
    }
  }
);

export const fetchPublicDoctorReviews = createAsyncThunk(
  "reviews/fetchPublicDoctorReviews",
  async ({ doctorId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await getPublicDoctorReviewsApi({
        doctorId,
        params,
      });

      return normalizePaginatedResponse(response.data, "reviews");
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch doctor reviews")
      );
    }
  }
);

export const fetchPublicDoctorReviewSummary = createAsyncThunk(
  "reviews/fetchPublicDoctorReviewSummary",
  async (doctorId, { rejectWithValue }) => {
    try {
      const response = await getPublicDoctorReviewSummaryApi(doctorId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch review summary")
      );
    }
  }
);

export const fetchDoctorOwnReviews = createAsyncThunk(
  "reviews/fetchDoctorOwnReviews",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getDoctorOwnReviewsApi(params);
      return normalizePaginatedResponse(response.data, "reviews");
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch doctor reviews")
      );
    }
  }
);

export const fetchAdminReviews = createAsyncThunk(
  "reviews/fetchAdminReviews",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminReviewsApi(params);
     return normalizePaginatedResponse(response.data, "reviews");
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch reviews")
      );
    }
  }
);

export const fetchAdminReviewDetails = createAsyncThunk(
  "reviews/fetchAdminReviewDetails",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await getAdminReviewDetailsApi(reviewId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch review details")
      );
    }
  }
);

export const approveReview = createAsyncThunk(
  "reviews/approveReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await approveReviewApi(reviewId);

      return {
        review: response.data,
        message: response.message || "Review approved successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to approve review")
      );
    }
  }
);

export const rejectReview = createAsyncThunk(
  "reviews/rejectReview",
  async ({ reviewId, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await rejectReviewApi({
        reviewId,
        rejectionReason,
      });

      return {
        review: response.data,
        message: response.message || "Review rejected successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to reject review")
      );
    }
  }
);

const reviewSlice = createSlice({
  name: "reviews",

  initialState: {
    myReviews: [],
    doctorReviews: [],
    adminReviews: [],
    publicDoctorReviews: [],

    selectedReview: null,
    publicReviewSummary: null,
    doctorOwnSummary: null,

    myPagination: null,
    publicPagination: null,
    doctorPagination: null,
    adminPagination: null,

    isLoading: false,
    isLoadingPublic: false,
    isSaving: false,
    isDeleting: false,

    error: null,
  },

  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },

    clearSelectedReview: (state) => {
      state.selectedReview = null;
    },

    clearPublicDoctorReviews: (state) => {
      state.publicDoctorReviews = [];
      state.publicReviewSummary = null;
      state.publicPagination = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(createReview.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(createReview.fulfilled, (state, action) => {
        state.isSaving = false;
        state.myReviews.unshift(action.payload.review);
      })

      .addCase(createReview.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(fetchMyReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.isLoading = false;
       state.myReviews = action.payload?.items || [];
state.myPagination = action.payload?.pagination || null;
      })

      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchMyReviewDetails.pending, (state) => {
        state.isLoading = true;
        state.selectedReview = null;
        state.error = null;
      })

      .addCase(fetchMyReviewDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedReview = action.payload;
      })

      .addCase(fetchMyReviewDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(updateMyReview.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(updateMyReview.fulfilled, (state, action) => {
        state.isSaving = false;
        state.selectedReview = action.payload.review;

        state.myReviews = state.myReviews.map((review) =>
          review._id === action.payload.review._id
            ? action.payload.review
            : review
        );
      })

      .addCase(updateMyReview.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(deleteMyReview.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })

      .addCase(deleteMyReview.fulfilled, (state, action) => {
        state.isDeleting = false;

        state.myReviews = state.myReviews.filter(
          (review) => review._id !== action.payload.reviewId
        );

        if (state.selectedReview?._id === action.payload.reviewId) {
          state.selectedReview = null;
        }
      })

      .addCase(deleteMyReview.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })

      .addCase(fetchPublicDoctorReviews.pending, (state) => {
        state.isLoadingPublic = true;
        state.error = null;
      })

      .addCase(fetchPublicDoctorReviews.fulfilled, (state, action) => {
        state.isLoadingPublic = false;
        state.publicDoctorReviews = action.payload?.items || [];
state.publicPagination = action.payload?.pagination || null;
      })

      .addCase(fetchPublicDoctorReviews.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.error = action.payload;
      })

      .addCase(fetchPublicDoctorReviewSummary.pending, (state) => {
        state.isLoadingPublic = true;
        state.error = null;
      })

      .addCase(fetchPublicDoctorReviewSummary.fulfilled, (state, action) => {
        state.isLoadingPublic = false;
        state.publicReviewSummary = action.payload;
      })

      .addCase(fetchPublicDoctorReviewSummary.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.error = action.payload;
      })

      .addCase(fetchDoctorOwnReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchDoctorOwnReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctorReviews = action.payload?.items || [];
state.doctorOwnSummary = action.payload?.summary || null;
state.doctorPagination = action.payload?.pagination || null;
      })

      .addCase(fetchDoctorOwnReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminReviews = action.payload?.items || [];
state.adminPagination = action.payload?.pagination || null;
      })

      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminReviewDetails.pending, (state) => {
        state.isLoading = true;
        state.selectedReview = null;
        state.error = null;
      })

      .addCase(fetchAdminReviewDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedReview = action.payload;
      })

      .addCase(fetchAdminReviewDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(approveReview.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(approveReview.fulfilled, (state, action) => {
        state.isSaving = false;

        state.adminReviews = state.adminReviews.map((review) =>
          review._id === action.payload.review._id
            ? action.payload.review
            : review
        );

        if (state.selectedReview?._id === action.payload.review._id) {
          state.selectedReview = action.payload.review;
        }
      })

      .addCase(approveReview.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(rejectReview.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(rejectReview.fulfilled, (state, action) => {
        state.isSaving = false;

        state.adminReviews = state.adminReviews.map((review) =>
          review._id === action.payload.review._id
            ? action.payload.review
            : review
        );

        if (state.selectedReview?._id === action.payload.review._id) {
          state.selectedReview = action.payload.review;
        }
      })

      .addCase(rejectReview.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearReviewError,
  clearSelectedReview,
  clearPublicDoctorReviews,
} = reviewSlice.actions;

export default reviewSlice.reducer;