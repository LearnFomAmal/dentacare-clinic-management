import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, ShieldPlus } from "lucide-react";
import toast from "react-hot-toast";

import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logoutUser } from "../../features/auth/authSlice";

function PatientLayout({ children }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser("patient")).unwrap();
      toast.success("Logged out successfully");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      toast.success("Logged out successfully");
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-[#F1F2F8] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[78px] max-w-[1120px] items-center justify-between px-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#9381FF] text-white shadow-[0_10px_24px_rgba(147,129,255,0.28)]">
              <ShieldPlus size={22} />
            </div>

            <span className="text-[28px] font-extrabold tracking-[-0.8px] text-[#111827]">
              DentaCare
            </span>
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            <PatientNavLink to={ROUTES.HOME}>Home</PatientNavLink>
            <PatientNavLink to={ROUTES.USER_SETTINGS}>
              Dashboard
            </PatientNavLink>
            <PatientNavLink to={ROUTES.FIND_DOCTORS}>
              Find Doctors
            </PatientNavLink>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-[#F0F1FF]">
                {user?.personalInfo?.profileImage || user?.profileImage ? (
                  <img
                    src={user?.personalInfo?.profileImage || user?.profileImage}
                    alt={user?.username || "Patient"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#9381FF]">
                    {(user?.username || user?.email || "P")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-extrabold leading-4 text-[#111827]">
                  {user?.username || "Patient"}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">Patient</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 text-sm font-bold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF]"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {children}
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
            : "text-[#2D333B] hover:text-[#9381FF]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default PatientLayout;