import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getAppointmentMessagesApi,
  getMyChatsApi,
  markChatReadApi,
  sendChatMessageApi,
} from "./chatService";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchMyChats = createAsyncThunk(
  "chats/fetchMyChats",
  async ({ role, params = {} }, { rejectWithValue }) => {
    try {
      const response = await getMyChatsApi({
        role,
        params,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch chats"));
    }
  }
);

export const fetchAppointmentMessages = createAsyncThunk(
  "chats/fetchAppointmentMessages",
  async ({ role, appointmentId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await getAppointmentMessagesApi({
        role,
        appointmentId,
        params,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch chat messages")
      );
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  "chats/sendChatMessage",
  async ({ role, appointmentId, text }, { rejectWithValue }) => {
    try {
      const response = await sendChatMessageApi({
        role,
        appointmentId,
        text,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to send message"));
    }
  }
);

export const markChatRead = createAsyncThunk(
  "chats/markChatRead",
  async ({ role, chatId }, { rejectWithValue }) => {
    try {
      const response = await markChatReadApi({
        role,
        chatId,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to mark chat as read")
      );
    }
  }
);

const isSameMessage = (messageOne, messageTwo) => {
  if (!messageOne || !messageTwo) return false;

  return String(messageOne._id) === String(messageTwo._id);
};

const chatSlice = createSlice({
  name: "chats",

  initialState: {
    chats: [],
    messages: [],
    currentChat: null,
    roomName: "",
    pagination: null,
    messagePagination: null,

    isLoadingChats: false,
    isLoadingMessages: false,
    isSending: false,
    isMarkingRead: false,

    error: null,
  },

  reducers: {
    clearChatError: (state) => {
      state.error = null;
    },

    clearCurrentChat: (state) => {
      state.messages = [];
      state.currentChat = null;
      state.roomName = "";
      state.messagePagination = null;
    },

    setCurrentChatFromSocket: (state, action) => {
      state.currentChat = action.payload?.chat || state.currentChat;
      state.roomName = action.payload?.roomName || state.roomName;
    },

    addRealtimeMessage: (state, action) => {
      const message = action.payload;

      if (!message?._id) return;

      const alreadyExists = state.messages.some((item) =>
        isSameMessage(item, message)
      );

      if (!alreadyExists) {
        state.messages.push(message);
      }
    },

    updateChatFromSocket: (state, action) => {
  const chat = action.payload;

  if (!chat?._id) return;

  if (state.currentChat?._id === chat._id) {
    state.currentChat = chat;
  }

  const existingIndex = state.chats.findIndex(
    (item) => String(item._id) === String(chat._id)
  );

  if (existingIndex >= 0) {
    state.chats.splice(existingIndex, 1);
  }

  state.chats.unshift(chat);
},
    markMessagesReadFromSocket: (state, action) => {
  const readerRole = action.payload?.readerRole;

  if (!readerRole) return;

  state.messages = state.messages.map((message) => {
    if (message.receiverRole === readerRole) {
      return {
        ...message,
        isRead: true,
        readAt: message.readAt || new Date().toISOString(),
      };
    }

    return message;
  });
},
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMyChats.pending, (state) => {
        state.isLoadingChats = true;
        state.error = null;
      })

      .addCase(fetchMyChats.fulfilled, (state, action) => {
        state.isLoadingChats = false;
        state.chats = action.payload?.chats || [];
        state.pagination = action.payload?.pagination || null;
      })

      .addCase(fetchMyChats.rejected, (state, action) => {
        state.isLoadingChats = false;
        state.error = action.payload;
      })

      .addCase(fetchAppointmentMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })

      .addCase(fetchAppointmentMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.currentChat = action.payload?.chat || null;
        state.messages = action.payload?.messages || [];
        state.roomName = action.payload?.roomName || "";
        state.messagePagination = action.payload?.pagination || null;
      })

      .addCase(fetchAppointmentMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload;
      })

      .addCase(sendChatMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })

      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isSending = false;

        const message = action.payload?.message;
        const chat = action.payload?.chat;

        if (message?._id) {
          const alreadyExists = state.messages.some((item) =>
            isSameMessage(item, message)
          );

          if (!alreadyExists) {
            state.messages.push(message);
          }
        }

        if (chat?._id) {
          state.currentChat = chat;
        }
      })

      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload;
      })

      .addCase(markChatRead.pending, (state) => {
        state.isMarkingRead = true;
      })

      .addCase(markChatRead.fulfilled, (state, action) => {
        state.isMarkingRead = false;

        const chat = action.payload?.chat;

        if (chat?._id) {
          state.currentChat = chat;

          state.chats = state.chats.map((item) =>
            String(item._id) === String(chat._id) ? chat : item
          );
        }
      })

      .addCase(markChatRead.rejected, (state, action) => {
        state.isMarkingRead = false;
        state.error = action.payload;
      });
  },
});

export const {
  addRealtimeMessage,
  clearChatError,
  clearCurrentChat,
  markMessagesReadFromSocket,
  setCurrentChatFromSocket,
  updateChatFromSocket,
} = chatSlice.actions;

export default chatSlice.reducer;