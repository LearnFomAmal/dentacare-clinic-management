import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

import { ROUTES } from "../constants/routes";
import { getAccountType, getAuthUser } from "../utils/authStorage";

const isDoctorProfessionallyVerified = (user) => {
  return Boolean(
    user?.accountStatus?.isVerified === true &&
      user?.verification?.status === "approved"
  );
};

const getRoleHome = (role, user = null) => {
  if (role === "admin") return ROUTES.ADMIN_DASHBOARD;

  if (role === "doctor") {
    if (!isDoctorProfessionallyVerified(user)) {
      return ROUTES.DOCTOR_SETTINGS;
    }

    return ROUTES.DOCTOR_DASHBOARD;
  }

  return ROUTES.PATIENT_DASHBOARD;
};

function PublicRoute({ children }) {
  const { isAuthenticated, user, accountType, role } = useAppSelector(
    (state) => state.auth
  );

  if (isAuthenticated && user) {
    const finalRole = role || accountType || user.role || user.accountType;

    return (
      <Navigate
        to={getRoleHome(finalRole, user)}
        replace
      />
    );
  }

  const storedAccountType = getAccountType();
  const storedUser = storedAccountType
    ? getAuthUser(storedAccountType)
    : null;

  if (storedAccountType && storedUser) {
    return (
      <Navigate
        to={getRoleHome(storedAccountType, storedUser)}
        replace
      />
    );
  }

  return children;
}

export default PublicRoute;