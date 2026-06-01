import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, ShieldPlus, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logoutUser } from "../../features/auth/authSlice";
import { getAuthUser } from "../../utils/authStorage";

const patientTopLinks = [
  {
    label: "Home",
    to: ROUTES.HOME,
    end: true,
  },
  {
    label: "Dashboard",
    to: ROUTES.PATIENT_DASHBOARD,
  },
  {
    label: "Find Doctors",
    to: ROUTES.FIND_DOCTORS,
  },
];

function PatientLayout({ children }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user: reduxUser, accountType } = useAppSelector(
    (state) => state.auth
  );

  const storedPatient = getAuthUser("patient");

  const user =
    accountType === "patient" && reduxUser ? reduxUser : storedPatient;

  const displayName =
    user?.username || user?.email || "Patient";

  const profileImage =
    user?.profileImage || user?.personalInfo?.profileImage || "";

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser("patient")).unwrap();

      toast.dismiss();
      toast.success("Logged out successfully");

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch {
      toast.dismiss();
      toast.success("Session cleared");

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <header className="sticky top-0 z-40 border-b border-[#EEF0F6] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[78px] max-w-[1120px] items-center justify-between px-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#9381FF] text-white shadow-[0_10px_24px_rgba(147,129,255,0.28)]">
              <ShieldPlus size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.7px]">
                DentaCare
              </h1>

              <p className="text-xs font-bold uppercase tracking-[1px] text-[#9381FF]">
                Patient
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {patientTopLinks.map((item) => (
              <TopNavLink key={item.label} to={item.to} end={item.end}>
                {item.label}
              </TopNavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#F0F1FF] text-sm font-bold text-[#9381FF]">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={18} />
                )}
              </div>

              <div>
                <p className="text-sm font-extrabold leading-4 text-[#111827]">
                  {displayName}
                </p>

                <p className="mt-1 text-xs text-[#6B7280]">
                  Patient
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center rounded-xl border border-[#E5E7EB] bg-white px-5 text-sm font-bold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF]"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto border-t border-[#F3F4F6] px-4 py-3 md:hidden">
          {patientTopLinks.map((item) => (
            <MobileTopLink key={item.label} to={item.to} end={item.end}>
              {item.label}
            </MobileTopLink>
          ))}
        </nav>
      </header>

      {children}
    </div>
  );
}

function TopNavLink({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `text-sm font-extrabold transition ${
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

function MobileTopLink({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
          isActive
            ? "bg-[#9381FF] text-white"
            : "bg-[#F8FAFC] text-[#6B7280]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default PatientLayout;