import { Navigate } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import {
  getAuthUser,
  getAccountType,
  saveAccountType,
  clearAuthStorage,
} from "../utils/authStorage";

const getRoleHome = (role) => {
  if (role === "admin") return ROUTES.ADMIN_PROFILE;
  if (role === "doctor") return ROUTES.DOCTOR_SETTINGS;
  return ROUTES.USER_SETTINGS;
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  const routeRole =
    allowedRoles.length === 1 ? allowedRoles[0] : getAccountType();

  if (!routeRole) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const user = getAuthUser(routeRole);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const normalizedRole = user.role || user.accountType || routeRole;

  if (normalizedRole !== routeRole) {
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

  // Make this browser tab remember which role it is using.
  saveAccountType(normalizedRole);

  return children;
}

export default ProtectedRoute;