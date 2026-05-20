import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

import { ROUTES } from "../constants/routes";
import {
  clearAuthStorage,
  getAccountType,
  getAuthUser,
  saveAccountType,
} from "../utils/authStorage";

const getRoleHome = (role) => {
  if (role === "admin") return ROUTES.ADMIN_PROFILE;
  if (role === "doctor") return ROUTES.DOCTOR_SETTINGS;
  return ROUTES.USER_SETTINGS;
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  const {
    user: reduxUser,
    role: reduxRole,
    accountType: reduxAccountType,
    isAuthenticated,
  } = useAppSelector((state) => state.auth);

  const routeRole =
    allowedRoles.length === 1
      ? allowedRoles[0]
      : reduxAccountType || getAccountType();

  if (!routeRole) {
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

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(normalizedRole)
  ) {
    return (
      <Navigate
        to={getRoleHome(normalizedRole)}
        replace
      />
    );
  }

  saveAccountType(normalizedRole);

  return children;
}

export default ProtectedRoute;