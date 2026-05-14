import { Navigate } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import {
  clearAccountType,
  clearAuthUser,
  getAccountType,
  getAuthUser,
} from "../utils/authStorage";

const getRoleHome = (role) => {
  if (role === "admin") return ROUTES.ADMIN_PROFILE;
  if (role === "doctor") return ROUTES.DOCTOR_SETTINGS;
  return ROUTES.USER_SETTINGS;
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = getAuthUser();
  const accountType = getAccountType();

  if (!user || !accountType) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const actualRole =
    user.role ||
    accountType;

  const normalizedRole =
    actualRole === "patient" ? "patient" : actualRole;

  // Prevent stale localStorage mismatch
  if (accountType !== normalizedRole) {
    clearAuthUser();
    clearAccountType();

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

  return children;
}

export default ProtectedRoute;