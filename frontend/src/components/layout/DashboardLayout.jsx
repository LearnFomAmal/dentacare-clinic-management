import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BadgePercent,
  CalendarCheck,
  FileCheck2,
  Gift,
  Home,
  ImagePlus,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldPlus,
  Star,
  Stethoscope,
  UsersRound,
  WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";
import { logoutUser } from "../../features/auth/authSlice";
import { ROUTES } from "../../constants/routes";

import {
  getAccountType,
  getAuthUser,
  saveAccountType,
} from "../../utils/authStorage";

import { useAppDispatch, useAppSelector } from "../../app/hooks";

import NotificationBell from "../notifications/NotificationBell";
import { fetchMyChats } from "../../features/chat/chatSlice";

const getRoleFromPath = (pathname) => {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }

  if (pathname === "/doctor" || pathname.startsWith("/doctor/")) {
    return "doctor";
  }

  return "patient";
};
const isDoctorProfessionallyVerified = (user) => {
  return Boolean(
    user?.accountStatus?.isVerified === true &&
      user?.verification?.status === "approved"
  );
};
const getRoleHome = (role, user = null) => {
  if (role === "admin") {
    return ROUTES.ADMIN_DASHBOARD || ROUTES.ADMIN_PROFILE;
  }

  if (role === "doctor") {
    if (!isDoctorProfessionallyVerified(user)) {
      return ROUTES.DOCTOR_VERIFICATION_STATUS;
    }

    return ROUTES.DOCTOR_DASHBOARD || ROUTES.DOCTOR_SETTINGS;
  }

  return ROUTES.PATIENT_DASHBOARD || ROUTES.USER_SETTINGS;
};

const getRoleLinks = (role, user = null) => {
  if (role === "admin") {
    return [
      {
        label: "Dashboard",
        to: ROUTES.ADMIN_DASHBOARD || ROUTES.ADMIN_PROFILE,
        icon: Home,
      },
      {
        label: "Patients",
        to: ROUTES.ADMIN_USERS,
        icon: UsersRound,
      },
      {
        label: "Doctors",
        to: ROUTES.ADMIN_DOCTORS,
        icon: Stethoscope,
      },
      {
        label: "Verifications",
        to: ROUTES.ADMIN_DOCTOR_VERIFICATION_REQUESTS,
        icon: FileCheck2,
      },
      {
        label: "Appointments",
        to: ROUTES.ADMIN_APPOINTMENTS,
        icon: CalendarCheck,
      },
      {
        label: "Coupons",
        to: ROUTES.ADMIN_COUPONS,
        icon: BadgePercent,
      },
      {
        label: "Banners",
        to: ROUTES.ADMIN_BANNERS,
        icon: ImagePlus,
      },
      {
        label: "Reviews",
        to: ROUTES.ADMIN_REVIEWS,
        icon: Star,
      },
      {
        label: "Profile",
        to: ROUTES.ADMIN_PROFILE,
        icon: Settings,
      },
    ];
  }

 if (role === "doctor") {
  const isDoctorVerified = isDoctorProfessionallyVerified(user);

    if (!isDoctorVerified) {
      return [
        {
          label: "Verification",
          to: ROUTES.DOCTOR_VERIFICATION_STATUS,
          icon: ShieldPlus,
        },
        {
          label: "Settings",
          to: ROUTES.DOCTOR_SETTINGS,
          icon: Settings,
        },
      ];
    }

    return [
      {
        label: "Dashboard",
        to: ROUTES.DOCTOR_DASHBOARD || ROUTES.DOCTOR_SETTINGS,
        icon: Home,
      },
      {
        label: "Appointments",
        to: ROUTES.DOCTOR_APPOINTMENTS,
        icon: CalendarCheck,
      },
      {
        label: "Slots",
        to: ROUTES.DOCTOR_SLOTS,
        icon: Stethoscope,
      },
      {
        label: "Earnings",
        to: ROUTES.DOCTOR_EARNINGS,
        icon: WalletCards,
      },
      {
        label: "Reviews",
        to: ROUTES.DOCTOR_REVIEWS,
        icon: Star,
      },
      {
        label: "Chats",
        to: ROUTES.DOCTOR_CHATS,
        icon: MessageCircle,
      },
      {
        label: "Settings",
        to: ROUTES.DOCTOR_SETTINGS,
        icon: Settings,
      },
    ];
  }

  return [
    {
      label: "Dashboard",
      to: ROUTES.PATIENT_DASHBOARD || ROUTES.USER_SETTINGS,
      icon: Home,
    },
    {
      label: "My Appointments",
      to: ROUTES.MY_APPOINTMENTS,
      icon: CalendarCheck,
    },
    {
      label: "Wallet",
      to: ROUTES.WALLET,
      icon: WalletCards,
    },
    {
      label: "Referrals",
      to: ROUTES.REFERRALS,
      icon: Gift,
    },
    {
      label: "Reviews",
      to: ROUTES.MY_REVIEWS,
      icon: Star,
    },
    {
      label: "Chats",
      to: ROUTES.CHATS,
      icon: MessageCircle,
    },
    {
      label: "Settings",
      to: ROUTES.USER_SETTINGS,
      icon: Settings,
    },
  ];
};

const patientTopLinks = [
  {
    label: "Home",
    to: ROUTES.HOME,
    end: true,
    match: (pathname) => pathname === ROUTES.HOME,
  },
  {
    label: "Dashboard",
    to: ROUTES.PATIENT_DASHBOARD || ROUTES.USER_SETTINGS,
    match: (pathname) =>
      pathname.startsWith("/my-appointments") ||
      pathname.startsWith("/my-reviews") ||
      pathname.startsWith("/wallet") ||
      pathname.startsWith("/referrals") ||
      pathname.startsWith("/chats") ||
      pathname.startsWith("/settings"),
  },
  {
    label: "Find Doctors",
    to: ROUTES.FIND_DOCTORS,
    match: (pathname) =>
      pathname === ROUTES.FIND_DOCTORS ||
      pathname.startsWith("/doctors") ||
      pathname.startsWith("/book-appointment") ||
      pathname.startsWith("/payment") ||
      pathname.startsWith("/payment-success") ||
      pathname.startsWith("/payment-failed"),
  },
];

const getInitials = ({
  username = "",
  firstName = "",
  lastName = "",
  email = "",
}) => {
  const clean = (value) => String(value || "").trim();

  if (firstName || lastName) {
    const first = clean(firstName).charAt(0);
    const last = clean(lastName).charAt(0);

    return `${first}${last}`.toUpperCase() || "DC";
  }

  if (username) {
    const parts = clean(username).split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }

    return clean(username).slice(0, 2).toUpperCase();
  }

  if (email) {
    return clean(email).slice(0, 2).toUpperCase();
  }

  return "DC";
};

function HeaderAvatar({ user, displayName, profileImage }) {
  const [imageFailed, setImageFailed] = useState(false);

  const initials = useMemo(
    () =>
      getInitials({
        username: user?.username || displayName,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      }),
    [user, displayName]
  );

  useEffect(() => {
    setImageFailed(false);
  }, [profileImage]);

  if (profileImage && !imageFailed) {
    return (
      <img
        src={profileImage}
        alt={displayName}
        className="h-full w-full object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span className="text-xs font-extrabold uppercase text-[#9381FF]">
      {initials}
    </span>
  );
}
function LogoutScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6 dark:bg-slate-950">
      <div className="w-full max-w-[360px] rounded-3xl border border-[#EEF0F6] bg-white p-8 text-center shadow-[0_24px_70px_rgba(17,24,39,0.08)] dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
          <LogOut size={24} />
        </div>

        <h1 className="mt-5 text-2xl font-extrabold text-[#111827] dark:text-white">
          Logging out
        </h1>

        <p className="mt-2 text-sm font-semibold leading-6 text-[#6B7280] dark:text-slate-400">
          Please wait while we safely clear your session.
        </p>
      </div>
    </div>
  );
}
function DashboardLayout({
  children,
  title = "Dashboard",
  description = "",
  showPageHeader = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user: reduxUser, accountType: reduxAccountType } = useAppSelector(
    (state) => state.auth
  );

  const { chats } = useAppSelector((state) => state.chats);

  const logoutStartedRef = useRef(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const routeRole = getRoleFromPath(location.pathname);

  const storedUser = getAuthUser(routeRole);

  const user =
    reduxAccountType === routeRole && reduxUser ? reduxUser : storedUser;

const isVerifiedDoctor =
  routeRole === "doctor" && isDoctorProfessionallyVerified(user);

  const links = getRoleLinks(routeRole, user);

  useEffect(() => {
    const currentAccountType = getAccountType();

    if (currentAccountType !== routeRole && !logoutStartedRef.current) {
      saveAccountType(routeRole);
    }
  }, [routeRole]);




  useEffect(() => {
  if (!user) return;

if (!["patient", "doctor"].includes(routeRole)) return;

if (routeRole === "doctor" && !isVerifiedDoctor) return;

    dispatch(
      fetchMyChats({
        role: routeRole,
        params: {
          page: 1,
          limit: 30,
        },
      })
    );

    const intervalId = window.setInterval(() => {
      dispatch(
        fetchMyChats({
          role: routeRole,
          params: {
            page: 1,
            limit: 30,
          },
        })
      );
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dispatch, routeRole, isVerifiedDoctor, user?._id]);

  const homeLink = getRoleHome(routeRole, user);

  const chatUnreadCount = useMemo(() => {
    if (!["patient", "doctor"].includes(routeRole)) return 0;

    if (routeRole === "doctor" && !isVerifiedDoctor) return 0;

    return chats.reduce(
      (sum, chat) => sum + Number(chat.unreadCount || 0),
      0
    );
  }, [chats, routeRole, isVerifiedDoctor]);

  const displayName =
    user?.username ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    routeRole.charAt(0).toUpperCase() + routeRole.slice(1);

  const profileImage =
    user?.profileImage ||
    user?.personalInfo?.profileImage ||
    user?.professionalInfo?.profileImage ||
    "";

  const shouldShowNotificationBell =
    routeRole !== "doctor" || isVerifiedDoctor;

 const handleLogout = async () => {
  if (logoutStartedRef.current) return;

  logoutStartedRef.current = true;
  setIsLoggingOut(true);
  setMobileSidebarOpen(false);

  const currentRole = routeRole;
  const loginPath =
    currentRole === "admin"
      ? ROUTES.ADMIN_LOGIN || "/admin/login"
      : ROUTES.LOGIN;

  toast.dismiss();

  try {
    const result = await dispatch(logoutUser(currentRole)).unwrap();

    toast.success(result.message || "Logged out successfully");
  } catch {
    toast.success("Session cleared");
  }

  navigate(loginPath, {
    replace: true,
  });
};

  const sidebarWidthClass = sidebarCollapsed ? "lg:w-[88px]" : "lg:w-[270px]";

  const contentPaddingClass = sidebarCollapsed
    ? "lg:pl-[88px]"
    : "lg:pl-[270px]";

  const pageContent = children || <Outlet />;
 if (isLoggingOut || logoutStartedRef.current) {
  return <LogoutScreen />;
}
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] dark:bg-slate-950">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[270px] border-r border-[#EEF0F6] bg-white px-5 py-6 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${sidebarWidthClass}`}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            to={homeLink}
            onClick={() => setMobileSidebarOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#9381FF] text-white shadow-[0_10px_24px_rgba(147,129,255,0.28)]">
              <ShieldPlus size={22} />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold tracking-[-0.7px] dark:text-white">
                  DentaCare
                </h1>

                <p className="text-xs font-bold uppercase tracking-[1px] text-[#9381FF]">
                  {routeRole}
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="hidden rounded-xl border border-[#EEF0F6] p-2 text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] dark:border-slate-800 lg:inline-flex"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          {links.map((item) => (
            <SidebarLink
              key={item.label}
              item={item}
              collapsed={sidebarCollapsed}
              badgeCount={item.label === "Chats" ? chatUnreadCount : 0}
              onClick={() => setMobileSidebarOpen(false)}
            />
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`absolute bottom-6 left-5 right-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-400 ${
            sidebarCollapsed ? "px-0" : "px-4"
          }`}
          title="Logout"
        >
          <LogOut size={17} />

          {!sidebarCollapsed && (
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          )}
        </button>
      </aside>

      <div className={`transition-all duration-300 ${contentPaddingClass}`}>
        <header className="sticky top-0 z-30 border-b border-[#EEF0F6] bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex h-[78px] items-center justify-between px-5 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EEF0F6] text-[#6B7280] lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>

              <div className="hidden lg:block">
                <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
                  Welcome back
                </p>

                <p className="text-lg font-extrabold text-[#111827] dark:text-white">
                  {displayName}
                </p>
              </div>
            </div>

            {routeRole === "patient" && (
              <nav className="hidden items-center gap-8 lg:flex">
                {patientTopLinks.map((item) => (
                  <TopNavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    match={item.match}
                  >
                    {item.label}
                  </TopNavLink>
                ))}
              </nav>
            )}

            <div className="flex items-center gap-3">
              {shouldShowNotificationBell && (
                <NotificationBell role={routeRole} />
              )}

              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#F0F1FF] text-sm font-bold text-[#9381FF] dark:bg-slate-800">
                  <HeaderAvatar
                    user={user}
                    displayName={displayName}
                    profileImage={profileImage}
                  />
                </div>

                <div>
                  <p className="text-sm font-extrabold leading-4 text-[#111827] dark:text-white">
                    {displayName}
                  </p>

                  <p className="mt-1 text-xs capitalize text-[#6B7280] dark:text-slate-400">
                    {routeRole}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {routeRole === "patient" && (
            <nav className="flex gap-2 overflow-x-auto border-t border-[#F3F4F6] px-4 py-3 dark:border-slate-800 lg:hidden">
              {patientTopLinks.map((item) => (
                <MobileTopLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  match={item.match}
                >
                  {item.label}
                </MobileTopLink>
              ))}
            </nav>
          )}
        </header>

        {showPageHeader ? (
          <main className="px-6 py-10 lg:px-10">
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold tracking-[-1px] text-[#111827] dark:text-slate-100">
                {title}
              </h1>

              <p className="mt-2 text-base text-[#6B7280] dark:text-slate-400">
                {description || `Manage your ${routeRole} workspace.`}
              </p>
            </div>

            {pageContent}
          </main>
        ) : (
          pageContent
        )}
      </div>
    </div>
  );
}

function SidebarLink({ item, collapsed, badgeCount = 0, onClick }) {
  const Icon = item.icon;
  const showBadge = Number(badgeCount || 0) > 0;
  const displayBadge = badgeCount > 99 ? "99+" : badgeCount;

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      title={item.label}
      className={({ isActive }) =>
        `relative flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-extrabold transition ${
          collapsed ? "justify-center px-0" : ""
        } ${
          isActive
            ? "bg-[#9381FF] text-white shadow-[0_12px_24px_rgba(147,129,255,0.22)]"
            : "text-[#6B7280] hover:bg-[#F8F7FF] hover:text-[#9381FF] dark:text-slate-300 dark:hover:bg-slate-800"
        }`
      }
    >
      <div className="relative">
        <Icon size={18} />

        {collapsed && showBadge && (
          <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
            {displayBadge}
          </span>
        )}
      </div>

      {!collapsed && (
        <>
          <span>{item.label}</span>

          {showBadge && (
            <span className="ml-auto flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-extrabold text-white">
              {displayBadge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function TopNavLink({ to, children, end = false, match }) {
  const location = useLocation();

  const active = match
    ? match(location.pathname)
    : end
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <NavLink
      to={to}
      end={end}
      className={`text-sm font-extrabold transition ${
        active
          ? "text-[#9381FF]"
          : "text-[#2D333B] hover:text-[#9381FF] dark:text-slate-300"
      }`}
    >
      {children}
    </NavLink>
  );
}

function MobileTopLink({ to, children, end = false, match }) {
  const location = useLocation();

  const active = match
    ? match(location.pathname)
    : end
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <NavLink
      to={to}
      end={end}
      className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-[#9381FF] text-white"
          : "bg-[#F8FAFC] text-[#6B7280] dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {children}
    </NavLink>
  );
}

export default DashboardLayout;