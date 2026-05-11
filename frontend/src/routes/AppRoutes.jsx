import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import OtpVerificationPage from "../pages/public/OtpVerificationPage";
import ForgotPasswordPage from "../pages/public/ForgotPasswordPage";
import ResetPasswordPage from "../pages/public/ResetPasswordPage";
import DoctorVerificationPendingPage from "../pages/public/DoctorVerificationPendingPage";

import { ROUTES } from "../constants/routes";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.HOME}
        element={<Navigate to={ROUTES.LOGIN} replace />}
      />

      <Route
        path={ROUTES.LOGIN}
        element={<LoginPage />}
      />

      <Route
        path={ROUTES.REGISTER}
        element={<RegisterPage />}
      />

      <Route
        path={ROUTES.VERIFY_OTP}
        element={<OtpVerificationPage />}
      />

      <Route
        path={ROUTES.FORGOT_PASSWORD}
        element={<ForgotPasswordPage />}
      />

      <Route
        path={ROUTES.RESET_PASSWORD}
        element={<ResetPasswordPage />}
      />

      <Route
        path={ROUTES.DOCTOR_VERIFY}
        element={<DoctorVerificationPendingPage />}
      />
    </Routes>
  );
}

export default AppRoutes;