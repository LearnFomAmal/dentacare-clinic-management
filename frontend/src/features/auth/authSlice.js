import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginApi, logoutApi } from "./authService";
import {
  clearAuthStorage,
  getAccountType,
  getAuthUser,
  saveAccountType,
  saveAuthUser,
} from "../../utils/authStorage";
import { ROUTES } from "../../constants/routes";

// ==============================
// CONSTANTS
// ==============================
const VALID_ACCOUNT_TYPES = ["patient", "doctor", "admin"];

// ==============================
// HELPERS
// ==============================
const getRoleHome = (role) => {
  if (role === "admin") return "/admin/profile";
  if (role === "doctor") return "/doctor/settings";
  return "/";
};

const getEmptyAuthState = () => ({
  user: null,
  accountType: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
});

const normalizeUser = ({ backendUser = {}, email, accountType }) => {
  return {
    ...backendUser,
    email: backendUser.email || email,
    role: backendUser.role || accountType,
    accountType,
  };
};

const getInitialAuthState = () => {
  const accountType = getAccountType();

  if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
    return getEmptyAuthState();
  }

  const user = getAuthUser(accountType);

  if (!user) {
    return getEmptyAuthState();
  }

  const role = user.role || user.accountType || accountType;

  if (!VALID_ACCOUNT_TYPES.includes(role)) {
    clearAuthStorage(accountType);
    return getEmptyAuthState();
  }

  return {
    user,
    accountType,
    role,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  };
};

// ==============================
// THUNKS
// ==============================
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      const { accountType, email } = payload;

      if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
        return rejectWithValue({
          message: "Invalid account type",
          accountType,
          email,
        });
      }

      // Clear previous stored session for the same role before login.
      clearAuthStorage(accountType);

      const response = await loginApi(payload);

      const backendUser = response.data || {};

      const normalizedUser = normalizeUser({
        backendUser,
        email,
        accountType,
      });

      saveAccountType(accountType);
      saveAuthUser(normalizedUser, accountType);

      return {
        user: normalizedUser,
        accountType,
        role: accountType,
        message: response.message || "Login successful",
        redirectTo: getRoleHome(accountType),
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed";

      return rejectWithValue({
        message,
        accountType: payload.accountType,
        email: payload.email,
      });
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (accountType, { getState, rejectWithValue }) => {
    const currentAccountType =
      accountType || getState()?.auth?.accountType || getAccountType();

    try {
      if (currentAccountType) {
        await logoutApi(currentAccountType);
      }

      clearAuthStorage(currentAccountType);

      return {
        accountType: currentAccountType,
        message: "Logout successful",
      };
    } catch (error) {
      // Even if backend logout fails, frontend session should be cleared.
      clearAuthStorage(currentAccountType);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Logout failed, but local session cleared";

      return rejectWithValue({
        message,
        accountType: currentAccountType,
      });
    }
  }
);

// ==============================
// SLICE
// ==============================
const authSlice = createSlice({
  name: "auth",
  initialState: getInitialAuthState(),
  reducers: {
    hydrateAuthFromStorage: (state) => {
      const freshState = getInitialAuthState();

      state.user = freshState.user;
      state.accountType = freshState.accountType;
      state.role = freshState.role;
      state.isAuthenticated = freshState.isAuthenticated;
      state.isLoading = false;
      state.error = null;
    },

    setAuthUser: (state, action) => {
      const { user, accountType } = action.payload;

      const finalAccountType =
        accountType || user?.role || user?.accountType;

      if (!VALID_ACCOUNT_TYPES.includes(finalAccountType)) {
        state.error = "Invalid account type";
        return;
      }

      const normalizedUser = {
        ...user,
        role: finalAccountType,
        accountType: finalAccountType,
      };

      saveAccountType(finalAccountType);
      saveAuthUser(normalizedUser, finalAccountType);

      state.user = normalizedUser;
      state.accountType = finalAccountType;
      state.role = finalAccountType;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    clearAuth: (state, action) => {
      const accountType = action.payload || state.accountType || getAccountType();

      clearAuthStorage(accountType);

      state.user = null;
      state.accountType = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accountType = action.payload.accountType;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.error = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.accountType = null;
        state.role = null;
        state.isAuthenticated = false;
        state.error = action.payload?.message || "Login failed";
      })

      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accountType = null;
        state.role = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })

      .addCase(logoutUser.rejected, (state, action) => {
        // Even rejected logout means frontend session is cleared.
        state.user = null;
        state.accountType = null;
        state.role = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload?.message || null;
      });
  },
});

export const {
  hydrateAuthFromStorage,
  setAuthUser,
  clearAuth,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;