import { Link, useLocation, useNavigate } from "react-router-dom";
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

function DashboardLayout({
  children,
  title = "Dashboard",
}) {
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

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch (error) {
      clearAuthStorage(routeRole);

      const message =
        error?.response?.data?.message ||
        "Session cleared";

      toast.error(message);

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <header className="border-b border-[rgba(172,178,189,0.2)] bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to={
              routeRole === "admin"
                ? ROUTES.ADMIN_PROFILE
                : routeRole === "doctor"
                  ? ROUTES.DOCTOR_SETTINGS
                  : ROUTES.USER_SETTINGS
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C59A6] text-white">
              <ShieldPlus size={20} />
            </div>

            <div>
              <h2 className="font-manrope text-lg font-extrabold text-[#4C59A6] dark:text-[#B8B8FF]">
                DentaCare
              </h2>

              <p className="text-[10px] uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
                {routeRole}
              </p>
            </div>
          </Link>

          {routeRole === "admin" && (
            <nav className="hidden items-center gap-2 md:flex">
              <Link
                to={ROUTES.ADMIN_PROFILE}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:bg-[#F8FAFC] hover:text-[#4C59A6] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-[#B8B8FF]"
              >
                Profile
              </Link>

              <Link
                to={ROUTES.ADMIN_USERS}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:bg-[#F8FAFC] hover:text-[#4C59A6] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-[#B8B8FF]"
              >
                Patients
              </Link>

              <Link
                to={ROUTES.ADMIN_DOCTORS}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:bg-[#F8FAFC] hover:text-[#4C59A6] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-[#B8B8FF]"
              >
                Doctors
              </Link>
            </nav>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#B8B8FF] dark:hover:text-[#B8B8FF]"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="mb-8">
          <h1 className="font-manrope text-3xl font-extrabold text-[#2D333B] dark:text-slate-100">
            {title}
          </h1>

          <p className="mt-1 text-sm text-[#595F69] dark:text-slate-400">
            Welcome,{" "}
            <span className="font-semibold text-[#4C59A6] dark:text-[#B8B8FF]">
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

export default DashboardLayout;