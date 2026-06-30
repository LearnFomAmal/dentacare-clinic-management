import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  DOCTOR_VERIFICATION_ALLOWED_ROUTES,
  DOCTOR_VERIFICATION_PAGES,
  isDoctorProfessionallyVerified,
} from "../utils/doctorVerification";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { ROUTES } from "../constants/routes";
import {
  clearAuthStorage,
  getAccountType,
  getAuthUser,
  saveAccountType,
} from "../utils/authStorage";
import { verifyCurrentUser } from "../features/auth/authSlice";

const getRouteRoleFromPath = (pathname) => {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }

  if (pathname === "/doctor" || pathname.startsWith("/doctor/")) {
    return "doctor";
  }

  return "patient";
};



const getRoleHome = (role, user = null) => {
  if (role === "admin") {
    return ROUTES.ADMIN_DASHBOARD;
  }

  if (role === "doctor") {
    if (!isDoctorProfessionallyVerified(user)) {
      return ROUTES.DOCTOR_VERIFICATION_STATUS;
    }

    return ROUTES.DOCTOR_DASHBOARD;
  }

  return ROUTES.PATIENT_DASHBOARD;
};



const isBlockedOrDeleted = (user) => {
  return Boolean(
    user?.accountStatus?.isBlocked || user?.accountStatus?.isDeleted
  );
};
const mergeCachedAndServerUser = (cachedUser, serverUser) => {
  if (!cachedUser) return serverUser;
  if (!serverUser) return cachedUser;

  return {
    ...cachedUser,
    ...serverUser,
    accountStatus: {
      ...(cachedUser.accountStatus || {}),
      ...(serverUser.accountStatus || {}),
    },
    verification:
      serverUser.verification !== undefined
        ? serverUser.verification
        : cachedUser.verification,
  };
};
function ProtectedRoute({ children, allowedRoles = [] }) {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const {
    user: reduxUser,
    role: reduxRole,
    accountType: reduxAccountType,
    isAuthenticated,
  } = useAppSelector((state) => state.auth);

const routeRole = useMemo(() => {
  const pathRole = getRouteRoleFromPath(location.pathname);

  if (allowedRoles.length === 1) {
    return allowedRoles[0];
  }

  if (pathRole === "doctor" || pathRole === "admin") {
    return pathRole;
  }

  return reduxAccountType || getAccountType() || "patient";
}, [allowedRoles, reduxAccountType, location.pathname]);

  const cachedUser = useMemo(() => {
    if (!routeRole) return null;

    if (isAuthenticated && reduxAccountType === routeRole && reduxUser) {
      return reduxUser;
    }

    return getAuthUser(routeRole);
  }, [isAuthenticated, reduxAccountType, reduxUser, routeRole]);

  const [serverUser, setServerUser] = useState(null);
  const [verificationDone, setVerificationDone] = useState(Boolean(cachedUser));
  const [verificationFailed, setVerificationFailed] = useState(false);

  const user = serverUser || cachedUser;

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      if (!routeRole) {
        if (!isMounted) return;

        setVerificationDone(true);
        setVerificationFailed(true);
        return;
      }

      const storedUser = getAuthUser(routeRole);
      const activeCachedUser =
        reduxAccountType === routeRole && reduxUser ? reduxUser : storedUser;

      const activeCachedRole =
        activeCachedUser?.role || activeCachedUser?.accountType || routeRole;

      const cachedUserIsUsable =
        activeCachedUser &&
        activeCachedRole === routeRole &&
        !isBlockedOrDeleted(activeCachedUser);

      if (cachedUserIsUsable) {
        setServerUser(null);
        setVerificationDone(true);
        setVerificationFailed(false);
      } else {
        setServerUser(null);
        setVerificationDone(false);
        setVerificationFailed(false);
      }

      try {
        const result = await dispatch(verifyCurrentUser(routeRole)).unwrap();

        if (!isMounted) return;

       const mergedUser = mergeCachedAndServerUser(activeCachedUser, result.user);

setServerUser(mergedUser);
setVerificationDone(true);
setVerificationFailed(false);
      } catch {
        clearAuthStorage(routeRole);

        if (!isMounted) return;

        setServerUser(null);
        setVerificationDone(true);
        setVerificationFailed(true);
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, routeRole]);

  if (!routeRole) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!verificationDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="rounded-3xl bg-white px-8 py-6 text-sm font-extrabold text-[#6B7280] shadow-[0_18px_48px_rgba(17,24,39,0.08)]">
          Checking session...
        </div>
      </div>
    );
  }

  if (verificationFailed) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!user) {
    clearAuthStorage(routeRole);
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const normalizedRole = user.role || user.accountType || reduxRole || routeRole;

  if (normalizedRole !== routeRole) {
    clearAuthStorage(routeRole);
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (isBlockedOrDeleted(user)) {
    clearAuthStorage(routeRole);
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to={getRoleHome(normalizedRole, user)} replace />;
  }

  const isDoctorRestrictedRoute =
    normalizedRole === "doctor" &&
    !isDoctorProfessionallyVerified(user) &&
    !DOCTOR_VERIFICATION_ALLOWED_ROUTES.includes(location.pathname);
     const isVerifiedDoctorOpeningVerificationRoute =
  normalizedRole === "doctor" &&
  isDoctorProfessionallyVerified(user) &&
  DOCTOR_VERIFICATION_PAGES.includes(location.pathname);

if (isVerifiedDoctorOpeningVerificationRoute) {
  return <Navigate to={ROUTES.DOCTOR_DASHBOARD} replace />;
}
  if (isDoctorRestrictedRoute) {
    return <Navigate to={ROUTES.DOCTOR_VERIFICATION_STATUS} replace />;
  }

  saveAccountType(normalizedRole);

  return children;
}

export default ProtectedRoute;