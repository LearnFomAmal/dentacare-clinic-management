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

function PublicRoute({ children }) {
  const user = getAuthUser();
  const accountType = getAccountType();

  if (user && accountType) {
    const actualRole = user.role || accountType;
    const normalizedRole =
      actualRole === "patient" ? "patient" : actualRole;

    if (accountType !== normalizedRole) {
      clearAuthUser();
      clearAccountType();

      return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return (
      <Navigate
        to={getRoleHome(normalizedRole)}
        replace
      />
    );
  }

  return children;
}

export default PublicRoute;