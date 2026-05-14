import { Navigate } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import {
  getAccountType,
  getAuthUser,
} from "../utils/authStorage";

function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const user = getAuthUser();
  const accountType = getAccountType();

  if (!user || !accountType) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
      />
    );
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(accountType)
  ) {
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

export default ProtectedRoute;