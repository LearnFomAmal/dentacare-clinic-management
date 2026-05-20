import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

import { ROUTES } from "../constants/routes";
import { getAccountType, getAuthUser } from "../utils/authStorage";

const getRoleHome = (role) => {
  if (role === "admin") return ROUTES.ADMIN_PROFILE;
  if (role === "doctor") return ROUTES.DOCTOR_SETTINGS;
  return ROUTES.USER_SETTINGS;
};

function PublicRoute({ children }) {
  const { isAuthenticated, user, accountType, role } = useAppSelector(
    (state) => state.auth
  );

  if (isAuthenticated && user) {
    return (
      <Navigate
        to={getRoleHome(role || accountType)}
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
        to={getRoleHome(storedAccountType)}
        replace
      />
    );
  }

  return children;
}

export default PublicRoute;