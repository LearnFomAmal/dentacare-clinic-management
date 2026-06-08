import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { ROUTES } from "../constants/routes";
import {
  clearAuthStorage,
  getAccountType,
  getAuthUser,
  saveAccountType,
} from "../utils/authStorage";
import { verifyCurrentUser } from "../features/auth/authSlice";

const getRoleHome = (role) => {
  if (role === "admin") return ROUTES.ADMIN_DASHBOARD;
  if (role === "doctor") return ROUTES.DOCTOR_DASHBOARD;
  return ROUTES.PATIENT_DASHBOARD;
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  const dispatch = useAppDispatch();

  const {
    user: reduxUser,
    role: reduxRole,
    accountType: reduxAccountType,
    isAuthenticated,
    isLoading,
  } = useAppSelector((state) => state.auth);

  const hasVerifiedRef = useRef(false);
  const [verificationDone, setVerificationDone] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);

  const routeRole =
    allowedRoles.length === 1
      ? allowedRoles[0]
      : reduxAccountType || getAccountType();

  useEffect(() => {
    if (!routeRole) {
      setVerificationDone(true);
      setVerificationFailed(true);
      return;
    }

    if (hasVerifiedRef.current) return;

    const storedUser = getAuthUser(routeRole);

    if (!storedUser && !reduxUser) {
      clearAuthStorage(routeRole);
      setVerificationDone(true);
      setVerificationFailed(true);
      return;
    }

    hasVerifiedRef.current = true;

    dispatch(verifyCurrentUser(routeRole))
      .unwrap()
      .then(() => {
        setVerificationDone(true);
        setVerificationFailed(false);
      })
      .catch(() => {
        clearAuthStorage(routeRole);
        setVerificationDone(true);
        setVerificationFailed(true);
      });
  }, [dispatch, routeRole, reduxUser]);

  if (!routeRole) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!verificationDone || isLoading) {
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

  let user = null;
  let normalizedRole = null;

  if (isAuthenticated && reduxUser) {
    user = reduxUser;
    normalizedRole = reduxRole || reduxAccountType || reduxUser.role;
  } else {
    const storedUser = getAuthUser(routeRole);

    if (!storedUser) {
      clearAuthStorage(routeRole);
      return <Navigate to={ROUTES.LOGIN} replace />;
    }

    user = storedUser;
    normalizedRole = storedUser.role || storedUser.accountType || routeRole;
  }

  if (!user || normalizedRole !== routeRole) {
    clearAuthStorage(routeRole);
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user.accountStatus?.isBlocked || user.accountStatus?.isDeleted) {
    clearAuthStorage(routeRole);
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(normalizedRole)
  ) {
    return <Navigate to={getRoleHome(normalizedRole)} replace />;
  }

  saveAccountType(normalizedRole);

  return children;
}

export default ProtectedRoute;