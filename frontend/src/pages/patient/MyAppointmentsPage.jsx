import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  RefreshCcw,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearAppointmentError,
  fetchMyAppointments,
} from "../../features/appointment/appointmentSlice";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getCleanStatus,
  getDoctorName,
  getSpecialtyName,
  getStatusBadgeClass,
} from "../../utils/appointmentUi";

const APPOINTMENT_PAGE_LIMIT = 6;

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
];

function MyAppointmentsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    myAppointments,
    myAppointmentStats,
    myAppointmentsPagination,
    isLoadingList,
    error,
  } = useAppSelector((state) => state.appointments);

  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchAppointments = ({ pageNumber = page } = {}) => {
    dispatch(
      fetchMyAppointments({
        status: activeStatus || undefined,
        page: pageNumber,
        limit: APPOINTMENT_PAGE_LIMIT,
      })
    );
  };

  useEffect(() => {
    fetchAppointments({
      pageNumber: page,
    });
  }, [dispatch, activeStatus, page]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  const stats = myAppointmentStats || {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    expired: 0,
  };

  const pagination = myAppointmentsPagination || {
    page,
    limit: APPOINTMENT_PAGE_LIMIT,
    totalAppointments: myAppointments.length,
    totalPages: 1,
  };

  const canGoPrevious = Number(pagination.page || page) > 1;

  const canGoNext =
    Number(pagination.page || page) < Number(pagination.totalPages || 1);

  const showingText = useMemo(() => {
    const total = Number(pagination.totalAppointments || 0);

    if (total === 0) {
      return "Showing 0 appointments";
    }

    const currentPage = Number(pagination.page || page);
    const limit = Number(pagination.limit || APPOINTMENT_PAGE_LIMIT);

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    return `Showing ${start} - ${end} of ${total} appointments`;
  }, [pagination, page]);

  const handleStatusChange = (status) => {
    setActiveStatus(status);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchAppointments({
      pageNumber: page,
    });
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
    <DashboardLayout showPageHeader={false}>
      <main className="mx-auto max-w-[1120px] px-6 py-10">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
              My appointments
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-[-1px] text-[#111827] dark:text-slate-100">
              Track Your Consultations
            </h1>

            <p className="mt-3 max-w-[680px] text-base leading-7 text-[#6B7280] dark:text-slate-400">
              View pending, approved, completed, cancelled, rejected, and
              expired appointment requests.
            </p>
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

        <section className="mb-6 grid gap-4 md:grid-cols-6">
          <StatCard label="Total" value={stats.total || 0} />
          <StatCard label="Pending" value={stats.pending || 0} />
          <StatCard label="Approved" value={stats.approved || 0} />
          <StatCard label="Completed" value={stats.completed || 0} />
          <StatCard label="Cancelled" value={stats.cancelled || 0} />
          <StatCard label="Expired" value={stats.expired || 0} />
        </section>

        <section className="mb-6 flex flex-wrap gap-3">
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
        </section>

        {isLoadingList ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-[#6B7280] dark:bg-slate-900 dark:text-slate-400">
            Loading appointments...
          </div>
        ) : myAppointments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-extrabold text-[#111827] dark:text-slate-100">
              No appointments found
            </h2>

            <p className="mt-2 text-sm text-[#6B7280] dark:text-slate-400">
              Your appointment requests will appear here after booking.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {myAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onView={() => navigate(`/my-appointments/${appointment._id}`)}
                />
              ))}
            </section>

            <PaginationControls
              showingText={showingText}
              page={pagination.page || page}
              totalPages={pagination.totalPages || 1}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              isLoading={isLoadingList}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
            />
          </>
        )}
      </main>
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
        {value}
      </p>
    </div>
  );
}

function AppointmentCard({ appointment, onView }) {
  return (
    <article className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#111827] dark:text-slate-100">
            Dr. {getDoctorName(appointment)}
          </h2>

          <p className="mt-1 flex items-center gap-2 text-sm font-bold text-[#9381FF]">
            <Stethoscope size={15} />
            {getSpecialtyName(appointment)}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${getStatusBadgeClass(
            appointment.status
          )}`}
        >
          {getCleanStatus(appointment.status)}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <p className="flex items-center gap-2 text-sm font-bold text-[#374151] dark:text-slate-300">
          <CalendarDays size={16} className="text-[#9381FF]" />
          {formatAppointmentDate(appointment.appointmentDate)}
        </p>

        <p className="flex items-center gap-2 text-sm font-bold text-[#374151] dark:text-slate-300">
          <Clock size={16} className="text-[#9381FF]" />
          {formatAppointmentTime(appointment.startTime)} –{" "}
          {formatAppointmentTime(appointment.endTime)}
        </p>
      </div>

      {appointment.status === "completed" && (
        <StatusNote
          title="Completed"
          text="Your consultation has been completed."
          className="bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
        />
      )}

      {appointment.status === "cancelled" && (
        <StatusNote
          title={`Cancelled by ${
            appointment.cancellation?.cancelledBy || "N/A"
          }`}
          text={appointment.cancellation?.reason || "No reason provided"}
          className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        />
      )}

      {appointment.status === "rejected" && (
        <StatusNote
          title="Rejection reason"
          text={appointment.rejection?.reason || "No reason provided"}
          className="bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
        />
      )}

      {appointment.status === "expired" && (
        <StatusNote
          title="Expired"
          text="This appointment expired because the scheduled time passed without approval."
          className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        />
      )}

      <button
        type="button"
        onClick={onView}
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white transition hover:bg-[#7E6EF2]"
      >
        <Eye size={16} />
        View Details
      </button>
    </article>
  );
}

function StatusNote({ title, text, className }) {
  return (
    <div className={`mt-5 rounded-2xl p-4 ${className}`}>
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

      <div className="flex items-center gap-3">
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
          Page {page} of {totalPages || 1}
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

export default MyAppointmentsPage;