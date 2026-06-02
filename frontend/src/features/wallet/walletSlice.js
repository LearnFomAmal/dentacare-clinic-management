import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getMyWalletApi,
  getWalletTransactionsApi,
  topupWalletApi,
} from "./walletService";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchMyWallet = createAsyncThunk(
  "wallet/fetchMyWallet",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyWalletApi();

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch wallet")
      );
    }
  }
);

export const fetchWalletTransactions = createAsyncThunk(
  "wallet/fetchWalletTransactions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getWalletTransactionsApi(params);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch wallet transactions")
      );
    }
  }
);

export const topupWallet = createAsyncThunk(
  "wallet/topupWallet",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await topupWalletApi(payload);

      return {
        wallet: response.data?.wallet,
        transaction: response.data?.transaction,
        message: response.message || "Wallet topped up successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to top up wallet")
      );
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",

  initialState: {
    wallet: null,
    transactions: [],
    pagination: null,

    isLoadingWallet: false,
    isLoadingTransactions: false,
    isToppingUp: false,

    error: null,
  },

  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },

    clearWalletState: (state) => {
      state.wallet = null;
      state.transactions = [];
      state.pagination = null;
      state.isLoadingWallet = false;
      state.isLoadingTransactions = false;
      state.isToppingUp = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMyWallet.pending, (state) => {
        state.isLoadingWallet = true;
        state.error = null;
      })

      .addCase(fetchMyWallet.fulfilled, (state, action) => {
        state.isLoadingWallet = false;
        state.wallet = action.payload;
        state.error = null;
      })

      .addCase(fetchMyWallet.rejected, (state, action) => {
        state.isLoadingWallet = false;
        state.error = action.payload || "Failed to fetch wallet";
      })

      .addCase(fetchWalletTransactions.pending, (state) => {
        state.isLoadingTransactions = true;
        state.error = null;
      })

      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.isLoadingTransactions = false;
        state.transactions = action.payload?.transactions || [];
        state.pagination = action.payload?.pagination || null;
        state.error = null;
      })

      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.isLoadingTransactions = false;
        state.error =
          action.payload || "Failed to fetch wallet transactions";
      })

      .addCase(topupWallet.pending, (state) => {
        state.isToppingUp = true;
        state.error = null;
      })

      .addCase(topupWallet.fulfilled, (state, action) => {
        state.isToppingUp = false;
        state.wallet = action.payload.wallet || state.wallet;

        if (action.payload.transaction) {
          state.transactions = [
            action.payload.transaction,
            ...state.transactions,
          ];
        }

        state.error = null;
      })

      .addCase(topupWallet.rejected, (state, action) => {
        state.isToppingUp = false;
        state.error = action.payload || "Failed to top up wallet";
      });
  },
});

export const { clearWalletError, clearWalletState } = walletSlice.actions;

export default walletSlice.reducer;