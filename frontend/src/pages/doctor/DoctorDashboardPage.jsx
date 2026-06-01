import { useEffect, useMemo } from "react";
import {
  CalendarCheck,
  Clock,
  Settings,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearAppointmentError,
  fetchDoctorAppointments,
} from "../../features/appointment/appointmentSlice";

function DoctorDashboardPage() {
  const dispatch = useAppDispatch();

  const { doctorAppointments, isLoadingList, error } = useAppSelector(
    (state) => state.appointments
  );

  useEffect(() => {
    dispatch(fetchDoctorAppointments());
  }, [dispatch]);

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
      rejected: doctorAppointments.filter((item) => item.status === "rejected")
        .length,
    };
  }, [doctorAppointments]);

  return (
    <DashboardLayout
      title="Doctor Dashboard"
      description="Manage appointment requests and consultation slots."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="Total Appointments"
            value={stats.total}
            icon={CalendarCheck}
          />

          <DashboardStatCard
            label="Pending Requests"
            value={stats.pending}
            icon={Clock}
          />

          <DashboardStatCard
            label="Approved"
            value={stats.approved}
            icon={ShieldCheck}
          />

          <DashboardStatCard
            label="Rejected"
            value={stats.rejected}
            icon={XCircle}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {/* <QuickActionCard
            to={ROUTES.DOCTOR_APPOINTMENTS}
            icon={CalendarCheck}
            title="Review Appointments"
            description="Approve or reject paid appointment requests from patients."
          /> */}

          <QuickActionCard
            to={ROUTES.DOCTOR_SLOTS}
            icon={Stethoscope}
            title="Manage Slots"
            description="Add, edit, and manage your consultation availability."
          />

          <QuickActionCard
            to={ROUTES.DOCTOR_SETTINGS}
            icon={Settings}
            title="Doctor Settings"
            description="Update profile details, theme, and password."
          />
        </section>

        <section className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#111827] dark:text-white">
                Recent Appointment Requests
              </h2>

              <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
                Latest appointments assigned to you.
              </p>
            </div>

            <Link
              to={ROUTES.DOCTOR_APPOINTMENTS}
              className="rounded-xl bg-[#F0F1FF] px-4 py-2 text-sm font-extrabold text-[#9381FF] transition hover:bg-[#E4E0FF]"
            >
              View All
            </Link>
          </div>

          {isLoadingList ? (
            <p className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280]">
              Loading appointments...
            </p>
          ) : doctorAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-8 text-center dark:border-slate-700 dark:bg-slate-950">
              <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
                No appointment requests found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {doctorAppointments.slice(0, 4).map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between rounded-2xl border border-[#EEF0F6] p-4 dark:border-slate-800"
                >
                  <div>
                    <p className="font-extrabold text-[#111827] dark:text-white">
                      {appointment.patient?.username ||
                        appointment.patientId?.username ||
                        "Patient"}
                    </p>

                    <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
                      {appointment.appointmentDate
                        ? new Date(
                            appointment.appointmentDate
                          ).toLocaleDateString("en-IN")
                        : "Date not available"}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#F0F1FF] px-3 py-1 text-xs font-extrabold capitalize text-[#9381FF]">
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function DashboardStatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
          {label}
        </p>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 text-4xl font-extrabold text-[#111827] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function QuickActionCard({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.04)] transition hover:border-[#9381FF] hover:bg-[#F8F7FF] dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
        <Icon size={22} />
      </div>

      <h2 className="mt-5 text-xl font-extrabold text-[#111827] dark:text-white">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6B7280] dark:text-slate-400">
        {description}
      </p>
    </Link>
  );
}

export default DoctorDashboardPage;