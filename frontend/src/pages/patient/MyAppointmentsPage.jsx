import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Eye, Stethoscope } from "lucide-react";
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

const STATUS_TABS = [
  {
    label: "All",
    value: "",
  },
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Approved",
    value: "approved",
  },
  {
    label: "Rejected",
    value: "rejected",
  },
  {
    label: "Payment Pending",
    value: "pending_payment",
  },
];

function MyAppointmentsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { myAppointments, isLoadingList, error } = useAppSelector(
    (state) => state.appointments
  );

  const [activeStatus, setActiveStatus] = useState("");

  useEffect(() => {
    dispatch(fetchMyAppointments(activeStatus ? { status: activeStatus } : {}));
  }, [dispatch, activeStatus]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  const stats = useMemo(() => {
    return {
      total: myAppointments.length,
      pending: myAppointments.filter((item) => item.status === "pending")
        .length,
      approved: myAppointments.filter((item) => item.status === "approved")
        .length,
      rejected: myAppointments.filter((item) => item.status === "rejected")
        .length,
    };
  }, [myAppointments]);

  return (
    <DashboardLayout showPageHeader={false}>
      <main className="mx-auto max-w-[1120px] px-6 py-10">
        <section className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
            My appointments
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-[-1px] text-[#111827] dark:text-slate-100">
            Track Your Consultations
          </h1>

          <p className="mt-3 max-w-[680px] text-base leading-7 text-[#6B7280] dark:text-slate-400">
            View pending, approved, rejected, and payment pending appointment
            requests.
          </p>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
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
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {myAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                onView={() => navigate(`/my-appointments/${appointment._id}`)}
              />
            ))}
          </section>
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

      {appointment.status === "rejected" && (
        <div className="mt-5 rounded-2xl bg-red-50 p-4 dark:bg-red-500/10">
          <p className="text-xs font-bold uppercase text-red-500">
            Rejection reason
          </p>

          <p className="mt-1 line-clamp-2 text-sm font-medium text-red-700 dark:text-red-300">
            {appointment.rejection?.reason || "No reason provided"}
          </p>
        </div>
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

export default MyAppointmentsPage;