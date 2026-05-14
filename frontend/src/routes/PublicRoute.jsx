import { Navigate } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import {
  getAccountType,
  getAuthUser,
} from "../utils/authStorage";

function PublicRoute({ children }) {
  const user = getAuthUser();
  const accountType = getAccountType();

  if (user && accountType) {
    if (accountType === "admin") {
      return (
        <Navigate
          to={ROUTES.ADMIN_PROFILE}
          replace
        />
      );
    }

    if (accountType === "doctor") {
      return (
        <Navigate
          to={ROUTES.DOCTOR_SETTINGS}
          replace
        />
      );
    }

    return (
      <Navigate
        to={ROUTES.USER_SETTINGS}
        replace
      />
    );
  }

  return children;
}

export default PublicRoute;