import { Link, useNavigate } from "react-router-dom";
import { LogOut, ShieldPlus } from "lucide-react";
import toast from "react-hot-toast";

import { ROUTES } from "../../constants/routes";
import { logoutApi } from "../../features/auth/authService";
import {
  clearAccountType,
  clearAuthStorage,
  clearAuthUser,
  getAccountType,
  getAuthUser,
} from "../../utils/authStorage";

function DashboardLayout({
  children,
  title = "Dashboard",
}) {
  const navigate = useNavigate();

  const user = getAuthUser();
  const accountType = getAccountType();

  const handleLogout = async () => {
    try {
      await logoutApi(accountType);
      clearAuthStorage();
      toast.success("Logged out successfully");

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch (error) {
      clearAuthStorage();

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
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-[rgba(172,178,189,0.2)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C59A6] text-white">
              <ShieldPlus size={20} />
            </div>

            <div>
              <h2 className="font-manrope text-lg font-extrabold text-[#4C59A6]">
                DentaCare
              </h2>

              <p className="text-[10px] uppercase tracking-[1px] text-slate-500">
                {accountType || "dashboard"}
              </p>
            </div>
          </Link>
          
               {accountType === "admin" && (
  <nav className="hidden items-center gap-2 md:flex">
    <Link
      to={ROUTES.ADMIN_PROFILE}
      className="rounded-2xl px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:bg-[#F8FAFC] hover:text-[#4C59A6]"
    >
      Profile
    </Link>

    <Link
      to={ROUTES.ADMIN_USERS}
      className="rounded-2xl px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:bg-[#F8FAFC] hover:text-[#4C59A6]"
    >
      Patients
    </Link>

    <Link
      to={ROUTES.ADMIN_DOCTORS}
      className="rounded-2xl px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:bg-[#F8FAFC] hover:text-[#4C59A6]"
    >
      Doctors
    </Link>
  </nav>
)}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6]"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

    <main className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="mb-8">
          <h1 className="font-manrope text-3xl font-extrabold text-[#2D333B]">
            {title}
          </h1>

          <p className="mt-1 text-sm text-[#595F69]">
            Welcome,{" "}
            <span className="font-semibold text-[#4C59A6]">
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