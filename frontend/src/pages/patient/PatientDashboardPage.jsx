import { useEffect, useMemo } from "react";
import {
  CalendarCheck,
  Clock,
  Search,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearAppointmentError,
  fetchMyAppointments,
} from "../../features/appointment/appointmentSlice";

function PatientDashboardPage() {
  const dispatch = useAppDispatch();

  const { myAppointments, isLoadingList, error } = useAppSelector(
    (state) => state.appointments
  );

  useEffect(() => {
    dispatch(fetchMyAppointments());
  }, [dispatch]);

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

  const recentAppointments = myAppointments.slice(0, 3);

  return (
    <DashboardLayout
      title="Patient Dashboard"
      description="Track your appointments and continue booking dental consultations."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="Total Appointments"
            value={stats.total}
            icon={CalendarCheck}
          />

          <DashboardStatCard
            label="Pending"
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

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
          <div className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#111827] dark:text-white">
                  Recent Appointments
                </h2>

                <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
                  Latest booking requests from your account.
                </p>
              </div>

              <Link
                to={ROUTES.MY_APPOINTMENTS}
                className="rounded-xl bg-[#F0F1FF] px-4 py-2 text-sm font-extrabold text-[#9381FF] transition hover:bg-[#E4E0FF]"
              >
                View All
              </Link>
            </div>

            {isLoadingList ? (
              <p className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280]">
                Loading appointments...
              </p>
            ) : recentAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-8 text-center dark:border-slate-700 dark:bg-slate-950">
                <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
                  No appointments yet. Start by finding a doctor.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between rounded-2xl border border-[#EEF0F6] p-4 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-extrabold text-[#111827] dark:text-white">
                        Dr.{" "}
                        {appointment.doctor?.fullName ||
                          appointment.doctor?.name ||
                          appointment.doctorId?.firstName ||
                          "Doctor"}
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
          </div>

          <div className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-extrabold text-[#111827] dark:text-white">
              Quick Actions
            </h2>

            <div className="mt-5 space-y-3">
              <QuickAction
                to={ROUTES.FIND_DOCTORS}
                icon={Search}
                title="Find Doctors"
                description="Browse verified dental specialists."
              />

              <QuickAction
                to={ROUTES.MY_APPOINTMENTS}
                icon={CalendarCheck}
                title="My Appointments"
                description="Track appointment requests."
              />

              <QuickAction
                to={ROUTES.USER_SETTINGS}
                icon={Settings}
                title="Settings"
                description="Update profile and account details."
              />
            </div>
          </div>
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

function QuickAction({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-[#EEF0F6] p-4 transition hover:border-[#9381FF] hover:bg-[#F8F7FF] dark:border-slate-800 dark:hover:bg-slate-800"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
        <Icon size={19} />
      </div>

      <div>
        <p className="font-extrabold text-[#111827] dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
          {description}
        </p>
      </div>
    </Link>
  );
}

export default PatientDashboardPage;