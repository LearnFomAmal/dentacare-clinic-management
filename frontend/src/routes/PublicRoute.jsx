import { Navigate } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import {
  getAccountType,
  getAuthUser,
} from "../utils/authStorage";

const getRoleHome = (role) => {
  if (role === "admin") return ROUTES.ADMIN_PROFILE;
  if (role === "doctor") return ROUTES.DOCTOR_SETTINGS;
  return ROUTES.USER_SETTINGS;
};

function PublicRoute({ children }) {
  const activeAccountType = getAccountType();

  if (activeAccountType) {
    const activeUser = getAuthUser(activeAccountType);

    if (activeUser) {
      return (
        <Navigate
          to={getRoleHome(activeAccountType)}
          replace
        />
      );
    }
  }

  return children;
}

export default PublicRoute;