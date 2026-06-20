import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearAppointmentError,
  fetchDoctorAppointments,
} from "../../features/appointment/appointmentSlice";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getAppointmentDisplayStatus,
  getPatientName,
  getStatusBadgeClass,
  isApprovedAwaitingCompletion,
} from "../../utils/appointmentUi";

const APPOINTMENT_PAGE_LIMIT = 6;

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending Requests", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
];

function DoctorAppointmentsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    doctorAppointments,
    doctorAppointmentStats,
    doctorAppointmentsPagination,
    isLoadingList,
    error,
  } = useAppSelector((state) => state.appointments);

  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(1);

  const lastErrorRef = useRef("");

  const queryParams = useMemo(() => {
    return {
      page,
      limit: APPOINTMENT_PAGE_LIMIT,
      status: activeStatus || undefined,
    };
  }, [page, activeStatus]);

  useEffect(() => {
    dispatch(fetchDoctorAppointments(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    if (!error) return;

    if (lastErrorRef.current !== error) {
      toast.error(error);
      lastErrorRef.current = error;
    }

    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  const stats = doctorAppointmentStats || {
    total: 0,
    pending: 0,
    approved: 0,
    awaitingCompletion: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    expired: 0,
  };

  const pagination = doctorAppointmentsPagination || {
    page,
    limit: APPOINTMENT_PAGE_LIMIT,
    totalAppointments: doctorAppointments.length,
    totalPages: 1,
  };

  const currentPage = Number(pagination.page || page);
  const totalPages = Math.max(Number(pagination.totalPages || 1), 1);
  const totalAppointments = Number(pagination.totalAppointments || 0);
  const limit = Number(pagination.limit || APPOINTMENT_PAGE_LIMIT);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const showingText = useMemo(() => {
    if (totalAppointments === 0) {
      return "Showing 0 appointments";
    }

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalAppointments);

    return `Showing ${start} - ${end} of ${totalAppointments} appointments`;
  }, [currentPage, limit, totalAppointments]);

  const handleStatusChange = (status) => {
    setActiveStatus(status);
    setPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchDoctorAppointments(queryParams));
  };

  const handlePreviousPage = () => {
    if (!canGoPrevious || isLoadingList) return;

    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (!canGoNext || isLoadingList) return;

    setPage((prev) => prev + 1);
  };

  return (
    <DashboardLayout title="Doctor Appointments">
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard
          label="Awaiting Completion"
          value={stats.awaitingCompletion}
        />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Cancelled" value={stats.cancelled} />
        <StatCard label="Expired" value={stats.expired} />
      </section>

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className={`h-11 rounded-2xl px-5 text-sm font-extrabold transition ${
                activeStatus === tab.value
                  ? "bg-[#9381FF] text-white shadow-[0_12px_24px_rgba(147,129,255,0.24)]"
                  : "bg-white text-[#6B7280] ring-1 ring-[#EEF0F6] hover:text-[#9381FF] dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoadingList}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F8F7FF] px-5 text-sm font-extrabold text-[#9381FF] transition hover:bg-[#F0F1FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </section>

      {isLoadingList ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-[#6B7280] dark:bg-slate-900 dark:text-slate-400">
          Loading appointments...
        </div>
      ) : doctorAppointments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-extrabold text-[#111827] dark:text-slate-100">
            No appointments found
          </h2>

          <p className="mt-2 text-sm text-[#6B7280] dark:text-slate-400">
            Paid appointment requests will appear here.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            {doctorAppointments.map((appointment) => (
              <DoctorAppointmentCard
                key={appointment._id}
                appointment={appointment}
                onView={() =>
                  navigate(`/doctor/appointments/${appointment._id}`)
                }
              />
            ))}
          </section>

          <PaginationControls
            showingText={showingText}
            page={currentPage}
            totalPages={totalPages}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            isLoading={isLoadingList}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
          />
        </>
      )}
    </DashboardLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-5 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-extrabold text-[#111827] dark:text-slate-100">
        {value || 0}
      </p>
    </div>
  );
}

function DoctorAppointmentCard({ appointment, onView }) {
  return (
    <article className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111827] dark:text-slate-100">
            <UserRound size={18} className="text-[#9381FF]" />
            {getPatientName(appointment)}
          </h2>

          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[#374151] dark:text-slate-300">
            <CalendarDays size={16} className="text-[#9381FF]" />
            {formatAppointmentDate(appointment.appointmentDate)} ·{" "}
            {formatAppointmentTime(appointment.startTime)} -{" "}
            {formatAppointmentTime(appointment.endTime)}
          </p>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6B7280] dark:text-slate-400">
            {appointment.reason || "No reason provided"}
          </p>

          {appointment.status === "cancelled" && (
            <StatusNote
              title={`Cancelled by ${
                appointment.cancellation?.cancelledBy || "N/A"
              }`}
              text={appointment.cancellation?.reason || "No reason provided"}
              className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          )}

          {appointment.status === "expired" && (
            <StatusNote
              title="Expired"
              text="Appointment time passed without approval. Refund was credited to patient wallet."
              className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            />
          )}

          {isApprovedAwaitingCompletion(appointment) && (
            <StatusNote
              title="Awaiting Completion"
              text="Consultation time is over. Open details and mark this appointment as completed after physical consultation."
              className="bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
            />
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 md:items-end">
          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${getStatusBadgeClass(
              appointment.status
            )}`}
          >
            {getAppointmentDisplayStatus(appointment)}
          </span>

          <button
            type="button"
            onClick={onView}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#9381FF] px-5 text-sm font-extrabold text-white transition hover:bg-[#7E6EF2]"
          >
            <Eye size={16} />
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusNote({ title, text, className }) {
  return (
    <div className={`mt-4 rounded-2xl p-4 ${className}`}>
      <p className="text-xs font-bold uppercase">{title}</p>

      <p className="mt-1 line-clamp-2 text-sm font-medium">{text}</p>
    </div>
  );
}

function PaginationControls({
  showingText,
  page,
  totalPages,
  canGoPrevious,
  canGoNext,
  isLoading,
  onPrevious,
  onNext,
}) {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-[#EEF0F6] bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
        {showingText}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious || isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="rounded-2xl bg-[#F8FAFC] px-4 py-2 text-sm font-extrabold text-[#111827] dark:bg-slate-950 dark:text-slate-100">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default DoctorAppointmentsPage;