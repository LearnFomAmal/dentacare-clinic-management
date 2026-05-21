import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ShieldPlus } from "lucide-react";
import toast from "react-hot-toast";

import { ROUTES } from "../../constants/routes";
import { logoutApi } from "../../features/auth/authService";
import {
  clearAuthStorage,
  getAccountType,
  getAuthUser,
  saveAccountType,
} from "../../utils/authStorage";

const getRoleFromPath = (pathname) => {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/doctor")) return "doctor";
  return "patient";
};

function DashboardLayout({ children, title = "Dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const routeRole = getRoleFromPath(location.pathname);
  const accountType = getAccountType() || routeRole;

  if (accountType !== routeRole) {
    saveAccountType(routeRole);
  }

  const user = getAuthUser(routeRole);

  const handleLogout = async () => {
    try {
      await logoutApi(routeRole);
      clearAuthStorage(routeRole);
      toast.success("Logged out successfully");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      clearAuthStorage(routeRole);
      toast.success("Session cleared");
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  const homeLink =
    routeRole === "admin"
      ? ROUTES.ADMIN_PROFILE
      : routeRole === "doctor"
        ? ROUTES.DOCTOR_SETTINGS
        : ROUTES.HOME;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-[#F1F2F8] bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-[78px] max-w-[1120px] items-center justify-between px-6">
          <Link to={homeLink} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#9381FF] text-white shadow-[0_10px_24px_rgba(147,129,255,0.28)]">
              <ShieldPlus size={22} />
            </div>

            <div>
              <h2 className="text-[24px] font-extrabold leading-6 tracking-[-0.7px] text-[#111827] dark:text-white">
                DentaCare
              </h2>

              <p className="mt-1 text-[11px] font-bold uppercase tracking-[1px] text-[#6B7280] dark:text-slate-400">
                {routeRole}
              </p>
            </div>
          </Link>

          {routeRole === "patient" && (
            <nav className="hidden items-center gap-10 md:flex">
              <PatientNavLink to={ROUTES.HOME}>Home</PatientNavLink>
              <PatientNavLink to={ROUTES.USER_SETTINGS}>
                Dashboard
              </PatientNavLink>
              <PatientNavLink to={ROUTES.FIND_DOCTORS}>
                Find Doctors
              </PatientNavLink>
            </nav>
          )}

          {routeRole === "admin" && (
            <nav className="hidden items-center gap-7 md:flex">
              <AdminDoctorNavLink to={ROUTES.ADMIN_PROFILE}>
                Profile
              </AdminDoctorNavLink>
              <AdminDoctorNavLink to={ROUTES.ADMIN_USERS}>
                Patients
              </AdminDoctorNavLink>
              <AdminDoctorNavLink to={ROUTES.ADMIN_DOCTORS}>
                Doctors
              </AdminDoctorNavLink>
            </nav>
          )}

          {routeRole === "doctor" && (
            <nav className="hidden items-center gap-7 md:flex">
              <AdminDoctorNavLink to={ROUTES.DOCTOR_SETTINGS}>
                Settings
              </AdminDoctorNavLink>
              <AdminDoctorNavLink to={ROUTES.DOCTOR_SLOTS}>
                Slots
              </AdminDoctorNavLink>
            </nav>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 text-sm font-bold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-[-1px] text-[#111827] dark:text-slate-100">
            {title}
          </h1>

          <p className="mt-2 text-base text-[#6B7280] dark:text-slate-400">
            Welcome,{" "}
            <span className="font-bold text-[#4C59A6] dark:text-[#B8B8FF]">
              {user?.username ||
                [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                user?.email ||
                "User"}
            </span>
          </p>
        </div>

        {children}
      </main>
    </div>
  );
}

function PatientNavLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-[16px] font-bold transition ${
          isActive
            ? "text-[#9381FF]"
            : "text-[#2D333B] hover:text-[#9381FF] dark:text-slate-300 dark:hover:text-[#B8B8FF]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function AdminDoctorNavLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-sm font-bold transition ${
          isActive
            ? "text-[#9381FF]"
            : "text-[#595F69] hover:text-[#9381FF] dark:text-slate-300 dark:hover:text-[#B8B8FF]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default DashboardLayout;