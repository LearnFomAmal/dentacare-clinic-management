import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createBannerApi,
  deleteBannerApi,
  getAdminBannerDetailsApi,
  getAdminBannersApi,
  getDoctorPageBannersApi,
  getHomeBannersApi,
  updateBannerApi,
  updateBannerStatusApi,
} from "./bannerService";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchHomeBanners = createAsyncThunk(
  "banners/fetchHomeBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getHomeBannersApi();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch home banners")
      );
    }
  }
);

export const fetchDoctorPageBanners = createAsyncThunk(
  "banners/fetchDoctorPageBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDoctorPageBannersApi();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch doctor page banners")
      );
    }
  }
);

export const fetchAdminBanners = createAsyncThunk(
  "banners/fetchAdminBanners",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminBannersApi(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch banners")
      );
    }
  }
);

export const fetchAdminBannerDetails = createAsyncThunk(
  "banners/fetchAdminBannerDetails",
  async (bannerId, { rejectWithValue }) => {
    try {
      const response = await getAdminBannerDetailsApi(bannerId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch banner details")
      );
    }
  }
);

export const createBanner = createAsyncThunk(
  "banners/createBanner",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await createBannerApi(formData);

      return {
        banner: response.data,
        message: response.message || "Banner created successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to create banner")
      );
    }
  }
);

export const updateBanner = createAsyncThunk(
  "banners/updateBanner",
  async ({ bannerId, formData }, { rejectWithValue }) => {
    try {
      const response = await updateBannerApi({
        bannerId,
        formData,
      });

      return {
        banner: response.data,
        message: response.message || "Banner updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update banner")
      );
    }
  }
);

export const updateBannerStatus = createAsyncThunk(
  "banners/updateBannerStatus",
  async ({ bannerId, isActive }, { rejectWithValue }) => {
    try {
      const response = await updateBannerStatusApi({
        bannerId,
        isActive,
      });

      return {
        banner: response.data,
        message: response.message || "Banner status updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update banner status")
      );
    }
  }
);

export const deleteBanner = createAsyncThunk(
  "banners/deleteBanner",
  async (bannerId, { rejectWithValue }) => {
    try {
      const response = await deleteBannerApi(bannerId);

      return {
        bannerId,
        message: response.message || "Banner deleted successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete banner")
      );
    }
  }
);

const bannerSlice = createSlice({
  name: "banners",

  initialState: {
    homeBanners: [],
    doctorPageBanners: [],

    adminBanners: [],
    selectedBanner: null,
    pagination: null,

    isLoadingPublic: false,
    isLoading: false,
    isSaving: false,
    isDeleting: false,

    error: null,
  },

  reducers: {
    clearBannerError: (state) => {
      state.error = null;
    },

    clearSelectedBanner: (state) => {
      state.selectedBanner = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeBanners.pending, (state) => {
        state.isLoadingPublic = true;
        state.error = null;
      })

      .addCase(fetchHomeBanners.fulfilled, (state, action) => {
        state.isLoadingPublic = false;
        state.homeBanners = action.payload || [];
      })

      .addCase(fetchHomeBanners.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.error = action.payload;
      })

      .addCase(fetchDoctorPageBanners.pending, (state) => {
        state.isLoadingPublic = true;
        state.error = null;
      })

      .addCase(fetchDoctorPageBanners.fulfilled, (state, action) => {
        state.isLoadingPublic = false;
        state.doctorPageBanners = action.payload || [];
      })

      .addCase(fetchDoctorPageBanners.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminBanners.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchAdminBanners.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminBanners = action.payload?.banners || [];
        state.pagination = action.payload?.pagination || null;
      })

      .addCase(fetchAdminBanners.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminBannerDetails.pending, (state) => {
        state.isLoading = true;
        state.selectedBanner = null;
        state.error = null;
      })

      .addCase(fetchAdminBannerDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedBanner = action.payload;
      })

      .addCase(fetchAdminBannerDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(createBanner.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(createBanner.fulfilled, (state, action) => {
        state.isSaving = false;
        state.adminBanners.unshift(action.payload.banner);
      })

      .addCase(createBanner.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(updateBanner.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(updateBanner.fulfilled, (state, action) => {
        state.isSaving = false;
        state.selectedBanner = action.payload.banner;
        state.adminBanners = state.adminBanners.map((banner) =>
          banner._id === action.payload.banner._id
            ? action.payload.banner
            : banner
        );
      })

      .addCase(updateBanner.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(updateBannerStatus.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })

      .addCase(updateBannerStatus.fulfilled, (state, action) => {
        state.isSaving = false;
        state.adminBanners = state.adminBanners.map((banner) =>
          banner._id === action.payload.banner._id
            ? action.payload.banner
            : banner
        );

        if (state.selectedBanner?._id === action.payload.banner._id) {
          state.selectedBanner = action.payload.banner;
        }
      })

      .addCase(updateBannerStatus.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(deleteBanner.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })

      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.adminBanners = state.adminBanners.filter(
          (banner) => banner._id !== action.payload.bannerId
        );
      })

      .addCase(deleteBanner.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearBannerError,
  clearSelectedBanner,
} = bannerSlice.actions;

export default bannerSlice.reducer;