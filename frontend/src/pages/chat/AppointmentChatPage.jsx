import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatInput from "../../components/chat/ChatInput";
import ChatMessageBubble from "../../components/chat/ChatMessageBubble";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  addRealtimeMessage,
  clearChatError,
  clearCurrentChat,
  fetchAppointmentMessages,
  markChatRead,
  sendChatMessage,
  setCurrentChatFromSocket,
  updateChatFromSocket,
  markMessagesReadFromSocket,
} from "../../features/chat/chatSlice";

import {
  connectChatSocket,
  disconnectChatSocket,
} from "../../socket/socketClient";

const getRoleFromPath = (pathname) => {
  return pathname === "/doctor" || pathname.startsWith("/doctor/")
    ? "doctor"
    : "patient";
};

function AppointmentChatPage() {
  const { appointmentId } = useParams();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const role = getRoleFromPath(location.pathname);

  const {
    currentChat,
    messages,
    isLoadingMessages,
    isSending,
    error,
  } = useAppSelector((state) => state.chats);

  const isReadOnly = Boolean(currentChat?.isReadOnly);
  const canSendMessage = Boolean(currentChat?.canSendMessage);

  useEffect(() => {
    if (!appointmentId) return;

    dispatch(
      fetchAppointmentMessages({
        role,
        appointmentId,
        params: {
          page: 1,
          limit: 50,
        },
      })
    );

    return () => {
      dispatch(clearCurrentChat());
    };
  }, [dispatch, role, appointmentId]);

  useEffect(() => {
    if (!appointmentId) return;

    const socket = connectChatSocket(role);
    socketRef.current = socket;

    socket.emit("join_chat", {
      appointmentId,
    });

    socket.on("chat_joined", (payload) => {
      dispatch(setCurrentChatFromSocket(payload));
    });

    socket.on("receive_message", (payload) => {
      if (payload?.message) {
        dispatch(addRealtimeMessage(payload.message));
      }

      if (payload?.chat) {
        dispatch(updateChatFromSocket(payload.chat));

        socket.emit("mark_chat_read", {
          chatId: payload.chat._id,
        });
      }
    });

    socket.on("messages_read", (payload) => {
      if (payload?.chat) {
        dispatch(updateChatFromSocket(payload.chat));
      }

      if (payload?.readerRole) {
        dispatch(
          markMessagesReadFromSocket({
            readerRole: payload.readerRole,
          })
        );
      }
    });

    socket.on("connect_error", () => {
      toast.error("Realtime chat connection failed");
    });

    socket.on("chat_error", (payload) => {
      toast.error(payload?.message || "Chat error");
    });

    return () => {
      socket.emit("leave_chat", {
        appointmentId,
      });

      socket.off("chat_joined");
      socket.off("receive_message");
      socket.off("messages_read");
      socket.off("connect_error");
      socket.off("chat_error");

      disconnectChatSocket();
    };
  }, [dispatch, role, appointmentId]);

  useEffect(() => {
    if (!currentChat?._id) return;

    dispatch(
      markChatRead({
        role,
        chatId: currentChat._id,
      })
    );

    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit("mark_chat_read", {
        chatId: currentChat._id,
      });
    }
  }, [dispatch, role, currentChat?._id]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearChatError());
  }, [error, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);

  const handleSendMessage = async (text) => {
    if (!text?.trim()) return;

    if (isReadOnly || !canSendMessage) {
      toast.error(
        currentChat?.readOnlyReason ||
          "This chat is read-only. You cannot send new messages."
      );
      return;
    }

    const socket = socketRef.current;

    if (socket?.connected) {
      const clientTempId = `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;

      socket.timeout(8000).emit(
        "send_message",
        {
          appointmentId,
          text,
          clientTempId,
        },
        (error, response) => {
          if (error) {
            toast.error("Message sent slowly. Refreshing chat...");
            dispatch(
              fetchAppointmentMessages({
                role,
                appointmentId,
                params: {
                  page: 1,
                  limit: 50,
                },
              })
            );
            return;
          }

          if (!response?.success) {
            toast.error(response?.message || "Failed to send message");
            return;
          }

          if (response?.message) {
            dispatch(addRealtimeMessage(response.message));
          }

          if (response?.chat) {
            dispatch(updateChatFromSocket(response.chat));
          }
        }
      );

      return;
    }

    try {
      const result = await dispatch(
        sendChatMessage({
          role,
          appointmentId,
          text,
        })
      ).unwrap();

      if (result?.message) {
        dispatch(addRealtimeMessage(result.message));
      }

      if (result?.chat) {
        dispatch(updateChatFromSocket(result.chat));
      }
    } catch (err) {
      toast.error(err || "Failed to send message");
    }
  };

  return (
    <DashboardLayout showPageHeader={false}>
      <main className="mx-auto flex h-[calc(100vh-78px)] max-w-[980px] flex-col px-4 py-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#EEF0F6] bg-[#F8FAFC] shadow-[0_18px_48px_rgba(17,24,39,0.06)]">
          {currentChat ? (
            <ChatHeader chat={currentChat} role={role} />
          ) : (
            <div className="border-b border-[#EEF0F6] bg-white px-5 py-4">
              <h1 className="text-lg font-extrabold text-[#111827]">
                Appointment Chat
              </h1>
            </div>
          )}

          {isReadOnly && (
            <div className="border-b border-orange-100 bg-orange-50 px-5 py-3">
              <p className="text-sm font-bold text-orange-700">
                {currentChat?.readOnlyReason ||
                  "This chat is read-only. You can view previous messages but cannot send new ones."}
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            {isLoadingMessages ? (
              <div className="rounded-2xl bg-white p-6 text-sm font-bold text-[#6B7280]">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F0F1FF] text-[#9381FF]">
                    <MessageCircle size={28} />
                  </div>

                  <h2 className="mt-5 text-xl font-extrabold text-[#111827]">
                    Start the conversation
                  </h2>

                  <p className="mt-2 max-w-[360px] text-sm leading-6 text-[#6B7280]">
                    This chat is available only for approved appointments.
                    Messages are shared between patient and doctor.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessageBubble
                    key={message._id}
                    message={message}
                    role={role}
                  />
                ))}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <ChatInput
            loading={isSending}
            disabled={!currentChat || isReadOnly || !canSendMessage}
            onSend={handleSendMessage}
          />
        </div>
      </main>
    </DashboardLayout>
  );
}

export default AppointmentChatPage;