import { useEffect } from "react";
import { CalendarDays, MessageCircle, Stethoscope, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearChatError,
  fetchMyChats,
} from "../../features/chat/chatSlice";

const getRoleFromPath = (pathname) => {
  return pathname === "/doctor" || pathname.startsWith("/doctor/")
    ? "doctor"
    : "patient";
};

const formatDate = (value) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDoctorName = (doctor) => {
  if (!doctor) return "Doctor";

  return `Dr. ${[doctor.firstName, doctor.lastName].filter(Boolean).join(" ")}`;
};

const getPatientName = (patient) => {
  return patient?.username || patient?.email || "Patient";
};

const getChatPath = ({ role, appointmentId }) => {
  if (role === "doctor") {
    return ROUTES.DOCTOR_CHAT_APPOINTMENT.replace(
      ":appointmentId",
      appointmentId
    );
  }

  return ROUTES.CHAT_APPOINTMENT.replace(":appointmentId", appointmentId);
};

function MyChatsPage() {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const role = getRoleFromPath(location.pathname);

  const { chats, isLoadingChats, error } = useAppSelector(
    (state) => state.chats
  );

  useEffect(() => {
    dispatch(
      fetchMyChats({
        role,
        params: {
          page: 1,
          limit: 30,
        },
      })
    );
  }, [dispatch, role]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearChatError());
  }, [error, dispatch]);

  return (
    <DashboardLayout
      title="Chats"
      description="View appointment-based conversations."
    >
      {isLoadingChats ? (
        <div className="rounded-3xl bg-white p-10 text-sm font-bold text-[#6B7280]">
          Loading chats...
        </div>
      ) : chats.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F0F1FF] text-[#9381FF]">
            <MessageCircle size={28} />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-[#111827]">
            No chats yet
          </h2>

          <p className="mt-2 text-sm text-[#6B7280]">
          Chats will appear here after an appointment is approved. Completed or cancelled appointment chats stay visible as read-only history.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {chats.map((chat) => (
            <ChatListCard key={chat._id} chat={chat} role={role} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function ChatListCard({ chat, role }) {
  const appointmentId = chat.appointmentId?._id || chat.appointmentId;

  const displayName =
    role === "doctor"
      ? getPatientName(chat.patientId)
      : getDoctorName(chat.doctorId);

  const subtitle =
    role === "doctor"
      ? chat.patientId?.email || "Patient"
      : chat.doctorId?.specialization?.displayName ||
        chat.doctorId?.specialization?.name ||
        "Dental Specialist";

  return (
    <Link
      to={getChatPath({
        role,
        appointmentId,
      })}
      className="flex flex-col gap-4 rounded-3xl border border-[#EEF0F6] bg-white p-5 shadow-[0_14px_38px_rgba(17,24,39,0.045)] transition hover:-translate-y-0.5 hover:border-[#B8B8FF] hover:shadow-[0_22px_52px_rgba(147,129,255,0.14)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
          {role === "doctor" ? <UserRound size={24} /> : <Stethoscope size={24} />}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold text-[#111827]">
            {displayName}
          </h3>

          <p className="mt-1 truncate text-sm font-bold text-[#9381FF]">
            {subtitle}
          </p>

          <p className="mt-3 line-clamp-1 text-sm text-[#6B7280]">
            {chat.lastMessage?.text || "No messages yet"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280]">
          <CalendarDays size={13} />
          {formatDate(chat.appointmentId?.appointmentDate)}
        </p>

        {chat.unreadCount > 0 && (
          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-extrabold text-white">
            {chat.unreadCount} new
          </span>
        )}
      </div>
    </Link>
  );
}

export default MyChatsPage;