import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  deleteNotificationApi,
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "./notificationService";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ role, params = {} }, { rejectWithValue }) => {
    try {
      const response = await getNotificationsApi({
        role,
        params,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch notifications")
      );
    }
  }
);

export const fetchUnreadNotificationCount = createAsyncThunk(
  "notifications/fetchUnreadNotificationCount",
  async (role, { rejectWithValue }) => {
    try {
      const response = await getUnreadNotificationCountApi(role);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch unread count")
      );
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async ({ role, notificationId }, { rejectWithValue }) => {
    try {
      const response = await markNotificationReadApi({
        role,
        notificationId,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to mark notification as read")
      );
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  async (role, { rejectWithValue }) => {
    try {
      const response = await markAllNotificationsReadApi(role);

      return {
        ...response.data,
        role,
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to mark all notifications as read")
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async ({ role, notificationId }, { rejectWithValue }) => {
    try {
      await deleteNotificationApi({
        role,
        notificationId,
      });

      return {
        notificationId,
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete notification")
      );
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",

  initialState: {
    notifications: [],
    pagination: null,
    unreadCount: 0,

    isLoading: false,
    isLoadingCount: false,
    isUpdating: false,

    error: null,
  },

  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.pagination = null;
      state.unreadCount = 0;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload?.notifications || [];
        state.pagination = action.payload?.pagination || null;
        state.unreadCount = action.payload?.unreadCount || 0;
      })

      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchUnreadNotificationCount.pending, (state) => {
        state.isLoadingCount = true;
      })

      .addCase(fetchUnreadNotificationCount.fulfilled, (state, action) => {
        state.isLoadingCount = false;
        state.unreadCount = action.payload?.unreadCount || 0;
      })

      .addCase(fetchUnreadNotificationCount.rejected, (state, action) => {
        state.isLoadingCount = false;
        state.error = action.payload;
      })

      .addCase(markNotificationRead.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.isUpdating = false;

        const updatedNotification = action.payload;

        state.notifications = state.notifications.map((notification) =>
          notification._id === updatedNotification._id
            ? updatedNotification
            : notification
        );

        state.unreadCount = Math.max(
          state.notifications.filter((item) => !item.isRead).length,
          0
        );
      })

      .addCase(markNotificationRead.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      .addCase(markAllNotificationsRead.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })

      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.isUpdating = false;
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }));
        state.unreadCount = 0;
      })

      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      .addCase(deleteNotification.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })

      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isUpdating = false;

        const deletedNotification = state.notifications.find(
          (notification) =>
            notification._id === action.payload.notificationId
        );

        state.notifications = state.notifications.filter(
          (notification) =>
            notification._id !== action.payload.notificationId
        );

        if (deletedNotification && !deletedNotification.isRead) {
          state.unreadCount = Math.max(state.unreadCount - 1, 0);
        }
      })

      .addCase(deleteNotification.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearNotificationError,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;