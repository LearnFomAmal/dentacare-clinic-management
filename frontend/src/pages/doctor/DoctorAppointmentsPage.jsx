import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, UserRound } from "lucide-react";
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
  getCleanStatus,
  getPatientName,
  getStatusBadgeClass,
} from "../../utils/appointmentUi";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending Requests", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rejected", value: "rejected" },
];

function DoctorAppointmentsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { doctorAppointments, isLoadingList, error } = useAppSelector(
    (state) => state.appointments
  );

  const [activeStatus, setActiveStatus] = useState("");

  useEffect(() => {
    dispatch(
      fetchDoctorAppointments(activeStatus ? { status: activeStatus } : {})
    );
  }, [dispatch, activeStatus]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  const stats = useMemo(() => {
    return {
      total: doctorAppointments.length,
      pending: doctorAppointments.filter((item) => item.status === "pending")
        .length,
      approved: doctorAppointments.filter((item) => item.status === "approved")
        .length,
      completed: doctorAppointments.filter(
        (item) => item.status === "completed"
      ).length,
      cancelled: doctorAppointments.filter(
        (item) => item.status === "cancelled"
      ).length,
    };
  }, [doctorAppointments]);

  return (
    <DashboardLayout title="Doctor Appointments">
      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Cancelled" value={stats.cancelled} />
      </section>

      <section className="mb-6 flex flex-wrap gap-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveStatus(tab.value)}
            className={`h-11 rounded-2xl px-5 text-sm font-extrabold transition ${
              activeStatus === tab.value
                ? "bg-[#9381FF] text-white shadow-[0_12px_24px_rgba(147,129,255,0.24)]"
                : "bg-white text-[#6B7280] ring-1 ring-[#EEF0F6] hover:text-[#9381FF]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {isLoadingList ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-[#6B7280]">
          Loading appointments...
        </div>
      ) : doctorAppointments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center">
          <h2 className="text-xl font-extrabold text-[#111827]">
            No appointments found
          </h2>

          <p className="mt-2 text-sm text-[#6B7280]">
            Paid appointment requests will appear here.
          </p>
        </div>
      ) : (
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
      )}
    </DashboardLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-5 shadow-[0_14px_38px_rgba(17,24,39,0.04)]">
      <p className="text-sm font-bold text-[#6B7280]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#111827]">{value}</p>
    </div>
  );
}

function DoctorAppointmentCard({ appointment, onView }) {
  return (
    <article className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111827]">
            <UserRound size={18} className="text-[#9381FF]" />
            {getPatientName(appointment)}
          </h2>

          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[#374151]">
            <CalendarDays size={16} className="text-[#9381FF]" />
            {formatAppointmentDate(appointment.appointmentDate)} ·{" "}
            {formatAppointmentTime(appointment.startTime)} -{" "}
            {formatAppointmentTime(appointment.endTime)}
          </p>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6B7280]">
            {appointment.reason || "No reason provided"}
          </p>

          {appointment.status === "cancelled" && (
            <div className="mt-4 rounded-2xl bg-slate-100 p-4">
              <p className="text-xs font-bold uppercase text-slate-600">
                Cancelled by {appointment.cancellation?.cancelledBy || "N/A"}
              </p>

              <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700">
                {appointment.cancellation?.reason || "No reason provided"}
              </p>
            </div>
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

export default DoctorAppointmentsPage;