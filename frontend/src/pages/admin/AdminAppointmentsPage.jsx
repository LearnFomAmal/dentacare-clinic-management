import { useEffect, useMemo, useState } from "react";
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

import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearAppointmentError,
  fetchAdminAppointments,
} from "../../features/appointment/appointmentSlice";

import {
  formatAppointmentDate,
  formatAppointmentTime,
  getCleanStatus,
  getDoctorName,
  getPatientName,
  getStatusBadgeClass,
} from "../../utils/appointmentUi";

const ADMIN_APPOINTMENT_PAGE_LIMIT = 6;

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
];

const getAppointmentSortTime = (appointment) => {
  return new Date(
    appointment.createdAt ||
      `${appointment.appointmentDate}T${appointment.startTime || "00:00"}`
  ).getTime();
};

const normalizeDoctorsResponse = (response) => {
  const payload = response?.data?.data || response?.data || response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.doctors)) {
    return payload.doctors;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const getDoctorFullName = (doctor) => {
  const fullName = [doctor?.firstName, doctor?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName ? `Dr. ${fullName}` : doctor?.email || "Doctor";
};

const getVisiblePages = ({ currentPage, totalPages }) => {
  const pages = [];

  if (totalPages <= 5) {
    for (let index = 1; index <= totalPages; index += 1) {
      pages.push(index);
    }

    return pages;
  }

  const start = Math.max(currentPage - 2, 1);
  const end = Math.min(start + 4, totalPages);
  const adjustedStart = Math.max(end - 4, 1);

  for (let index = adjustedStart; index <= end; index += 1) {
    pages.push(index);
  }

  return pages;
};

function AdminAppointmentsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    adminAppointments,
    adminAppointmentStats,
    adminAppointmentsPagination,
    isLoadingList,
    error,
  } = useAppSelector((state) => state.appointments);

  const [activeStatus, setActiveStatus] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [page, setPage] = useState(1);

  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  const currentPage = Number(adminAppointmentsPagination?.page || page || 1);
  const totalPages = Math.max(
    Number(adminAppointmentsPagination?.totalPages || 1),
    1
  );
  const totalAppointments = Number(
    adminAppointmentsPagination?.totalAppointments || 0
  );
  const limit = Number(
    adminAppointmentsPagination?.limit || ADMIN_APPOINTMENT_PAGE_LIMIT
  );

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const visiblePages = useMemo(() => {
    return getVisiblePages({
      currentPage,
      totalPages,
    });
  }, [currentPage, totalPages]);

  const showingText = useMemo(() => {
    if (totalAppointments === 0) {
      return "Showing 0 appointments";
    }

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalAppointments);

    return `Showing ${start} - ${end} of ${totalAppointments} appointments`;
  }, [currentPage, limit, totalAppointments]);

  useEffect(() => {
    dispatch(
      fetchAdminAppointments({
        page,
        limit: ADMIN_APPOINTMENT_PAGE_LIMIT,
        ...(activeStatus ? { status: activeStatus } : {}),
        ...(doctorId ? { doctorId } : {}),
      })
    );
  }, [dispatch, activeStatus, doctorId, page]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  useEffect(() => {
    let isMounted = true;

    const fetchDoctorsForFilter = async () => {
      try {
        setIsLoadingDoctors(true);

        const response = await axiosInstance.get(
          API_ENDPOINTS.DOCTOR.ADMIN_GET_ALL,
          {
            params: {
              page: 1,
              limit: 100,
              sortBy: "createdAt",
              order: "desc",
            },
          }
        );

        if (!isMounted) return;

        setDoctors(normalizeDoctorsResponse(response));
      } catch {
        if (isMounted) {
          setDoctors([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDoctors(false);
        }
      }
    };

    fetchDoctorsForFilter();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedAdminAppointments = useMemo(() => {
    return [...adminAppointments].sort(
      (a, b) => getAppointmentSortTime(b) - getAppointmentSortTime(a)
    );
  }, [adminAppointments]);

  const stats = adminAppointmentStats || {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    expired: 0,
  };

  const handleStatusChange = (status) => {
    setActiveStatus(status);
    setPage(1);
  };

  const handleDoctorChange = (value) => {
    setDoctorId(value);
    setPage(1);
  };

  const handleClearDoctorFilter = () => {
    setDoctorId("");
    setPage(1);
  };

  const handleRefresh = () => {
    dispatch(
      fetchAdminAppointments({
        page,
        limit: ADMIN_APPOINTMENT_PAGE_LIMIT,
        ...(activeStatus ? { status: activeStatus } : {}),
        ...(doctorId ? { doctorId } : {}),
      })
    );
  };

  const handlePreviousPage = () => {
    if (!canGoPrevious || isLoadingList) return;

    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (!canGoNext || isLoadingList) return;

    setPage((prev) => prev + 1);
  };

  const handleGoToPage = (targetPage) => {
    if (isLoadingList) return;
    if (targetPage === currentPage) return;

    setPage(targetPage);
  };

  return (
    <DashboardLayout title="Admin Appointments">
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Cancelled" value={stats.cancelled} />
        <StatCard label="Rejected" value={stats.rejected} />
        <StatCard label="Expired" value={stats.expired} />
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

      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={doctorId}
            onChange={(event) => handleDoctorChange(event.target.value)}
            disabled={isLoadingDoctors}
            className="h-12 min-w-[260px] rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">
              {isLoadingDoctors ? "Loading doctors..." : "All Doctors"}
            </option>

            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {getDoctorFullName(doctor)}
              </option>
            ))}
          </select>

          {doctorId && (
            <button
              type="button"
              onClick={handleClearDoctorFilter}
              className="h-12 w-fit rounded-2xl bg-[#F0F1FF] px-5 text-sm font-extrabold text-[#9381FF] transition hover:bg-[#E6E7FF]"
            >
              Clear Doctor Filter
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoadingList}
          className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-2xl border border-[#EEF0F6] bg-white px-5 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </section>

      {isLoadingList ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-[#6B7280] dark:bg-slate-900 dark:text-slate-400">
          Loading appointments...
        </div>
      ) : sortedAdminAppointments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-extrabold text-[#111827] dark:text-slate-100">
            No appointments found
          </h2>

          <p className="mt-2 text-sm text-[#6B7280] dark:text-slate-400">
            Try changing the status or doctor filter.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            {sortedAdminAppointments.map((appointment) => (
              <AdminAppointmentCard
                key={appointment._id}
                appointment={appointment}
                onView={() =>
                  navigate(`/admin/appointments/${appointment._id}`)
                }
              />
            ))}
          </section>

          <PaginationControls
            showingText={showingText}
            page={currentPage}
            totalPages={totalPages}
            visiblePages={visiblePages}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            isLoading={isLoadingList}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            onGoToPage={handleGoToPage}
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

function AdminAppointmentCard({ appointment, onView }) {
  return (
    <article className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111827] dark:text-slate-100">
            <UserRound size={18} className="text-[#9381FF]" />
            {getPatientName(appointment)}
          </h2>

          <p className="mt-2 text-sm font-bold text-[#6B7280] dark:text-slate-400">
            Doctor: Dr. {getDoctorName(appointment)}
          </p>

          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[#374151] dark:text-slate-300">
            <CalendarDays size={16} className="text-[#9381FF]" />
            {formatAppointmentDate(appointment.appointmentDate)} ·{" "}
            {formatAppointmentTime(appointment.startTime)} -{" "}
            {formatAppointmentTime(appointment.endTime)}
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

          {appointment.status === "rejected" && (
            <StatusNote
              title={`Rejected by ${
                appointment.rejection?.rejectedBy || "N/A"
              }`}
              text={appointment.rejection?.reason || "No reason provided"}
              className="bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
            />
          )}

          {appointment.status === "expired" && (
            <StatusNote
              title="Expired"
              text="Appointment time passed without approval. Refund was credited to patient wallet."
              className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            />
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 md:items-end">
          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${getStatusBadgeClass(
              appointment.status
            )}`}
          >
            {getCleanStatus(appointment.status)}
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
  visiblePages,
  canGoPrevious,
  canGoNext,
  isLoading,
  onPrevious,
  onNext,
  onGoToPage,
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-[#EEF0F6] bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
        {showingText}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canGoPrevious || isLoading}
          onClick={onPrevious}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-bold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {visiblePages.map((item) => (
          <button
            key={item}
            type="button"
            disabled={isLoading}
            onClick={() => onGoToPage(item)}
            className={`h-10 min-w-10 rounded-2xl px-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              item === page
                ? "bg-[#9381FF] text-white"
                : "border border-[#EEF0F6] text-[#6B7280] hover:border-[#9381FF] hover:text-[#9381FF] dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {item}
          </button>
        ))}

        <button
          type="button"
          disabled={!canGoNext || isLoading}
          onClick={onNext}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-bold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
        >
          Next
          <ChevronRight size={16} />
        </button>

        <span className="rounded-2xl bg-[#F8FAFC] px-4 py-2 text-sm font-extrabold text-[#111827] dark:bg-slate-950 dark:text-slate-100">
          Page {page} of {totalPages}
        </span>
      </div>
    </div>
  );
}

export default AdminAppointmentsPage;