import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createWalletRazorpayOrderApi,
  getMyWalletApi,
  getWalletTransactionsApi,
  verifyWalletRazorpayTopupApi,
  cancelWalletRazorpayTopupApi,
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


export const createWalletRazorpayOrder = createAsyncThunk(
  "wallet/createWalletRazorpayOrder",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createWalletRazorpayOrderApi(payload);

      return {
        order: response.data,
        message: response.message || "Wallet Razorpay order created",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to create wallet Razorpay order")
      );
    }
  }
);

export const verifyWalletRazorpayTopup = createAsyncThunk(
  "wallet/verifyWalletRazorpayTopup",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await verifyWalletRazorpayTopupApi(payload);

      return {
        wallet: response.data?.wallet,
        transaction: response.data?.transaction,
        message: response.message || "Wallet topped up successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to verify wallet top-up")
      );
    }
  }
);

export const cancelWalletRazorpayTopup = createAsyncThunk(
  "wallet/cancelWalletRazorpayTopup",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await cancelWalletRazorpayTopupApi(payload);

      return {
        cancelled: response.data?.cancelled,
        transaction: response.data?.transaction,
        message: response.message || "Wallet top-up cancelled",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to cancel wallet top-up")
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
    latestWalletRazorpayOrder: null,
    isCreatingWalletOrder: false,
    isCancellingWalletTopup: false,
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

       .addCase(createWalletRazorpayOrder.pending, (state) => {
  state.isCreatingWalletOrder = true;
  state.error = null;
})

.addCase(createWalletRazorpayOrder.fulfilled, (state, action) => {
  state.isCreatingWalletOrder = false;
  state.latestWalletRazorpayOrder = action.payload.order;
  state.error = null;
})

.addCase(createWalletRazorpayOrder.rejected, (state, action) => {
  state.isCreatingWalletOrder = false;
  state.error =
    action.payload || "Failed to create wallet Razorpay order";
})

.addCase(verifyWalletRazorpayTopup.pending, (state) => {
  state.isToppingUp = true;
  state.error = null;
})

.addCase(verifyWalletRazorpayTopup.fulfilled, (state, action) => {
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

.addCase(verifyWalletRazorpayTopup.rejected, (state, action) => {
  state.isToppingUp = false;
  state.error =
    action.payload || "Failed to verify wallet top-up";
})

.addCase(cancelWalletRazorpayTopup.pending, (state) => {
  state.isCancellingWalletTopup = true;
})

.addCase(cancelWalletRazorpayTopup.fulfilled, (state, action) => {
  state.isCancellingWalletTopup = false;

  const transaction = action.payload.transaction;

  if (transaction?._id) {
    state.transactions = state.transactions.map((item) =>
      item._id === transaction._id ? transaction : item
    );
  }
})

.addCase(cancelWalletRazorpayTopup.rejected, (state) => {
  state.isCancellingWalletTopup = false;
});

  },
});

export const { clearWalletError, clearWalletState } = walletSlice.actions;

export default walletSlice.reducer;