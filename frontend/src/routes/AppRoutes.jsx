import { Navigate, Route, Routes } from "react-router-dom";

import { ROUTES } from "../constants/routes";

import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";

import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import OtpVerificationPage from "../pages/public/OtpVerificationPage";
import ForgotPasswordPage from "../pages/public/ForgotPasswordPage";
import ResetPasswordPage from "../pages/public/ResetPasswordPage";
import DoctorVerificationPendingPage from "../pages/public/DoctorVerificationPendingPage";

import PatientSettingsPage from "../pages/patient/PatientSettingsPage";
import DoctorSettingsPage from "../pages/doctor/DoctorSettingsPage";

import AdminProfilePage from "../pages/admin/AdminProfilePage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminUserDetailsPage from "../pages/admin/AdminUserDetailsPage";
import AdminDoctorsPage from "../pages/admin/AdminDoctorsPage";
import AdminDoctorDetailsPage from "../pages/admin/AdminDoctorDetailsPage";
import AdminAddDoctorPage from "../pages/admin/AdminAddDoctorPage";
import AdminEditDoctorFeePage from "../pages/admin/AdminEditDoctorFeePage";
import DoctorSlotManagementPage from "../pages/doctor/DoctorSlotManagementPage";
import BookAppointmentPage from "../pages/patient/BookAppointmentPage";
import FindDoctorsPage from "../pages/patient/FindDoctorsPage";
import DoctorDetailsPage from "../pages/patient/DoctorDetailsPage";
function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route
        path={ROUTES.HOME}
        element={
          
            <HomePage />
        }
      />

      {/* Public Auth Routes */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.VERIFY_OTP}
        element={
          <PublicRoute>
            <OtpVerificationPage />
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.FORGOT_PASSWORD}
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.RESET_PASSWORD}
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.DOCTOR_VERIFY}
        element={
          <PublicRoute>
            <DoctorVerificationPendingPage />
          </PublicRoute>
        }
      />

      {/* Patient Routes */}
      <Route
        path={ROUTES.USER_SETTINGS}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
  path={ROUTES.FIND_DOCTORS}
  element={
    <ProtectedRoute allowedRoles={["patient"]}>
      <FindDoctorsPage />
    </ProtectedRoute>
  }
/>

<Route
  path={ROUTES.DOCTOR_DETAILS}
  element={
    <ProtectedRoute allowedRoles={["patient"]}>
      <DoctorDetailsPage />
    </ProtectedRoute>
  }
/>

      {/* Doctor Routes */}
      <Route
        path={ROUTES.DOCTOR_SETTINGS}
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path={ROUTES.ADMIN_PROFILE}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN_USERS}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN_USER_DETAILS}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUserDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN_DOCTORS}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDoctorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN_ADD_DOCTOR}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAddDoctorPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN_DOCTOR_DETAILS}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDoctorDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN_EDIT_DOCTOR_FEE}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminEditDoctorFeePage />
          </ProtectedRoute>
        }
      />
       <Route
   path={ROUTES.DOCTOR_SLOTS}
   element={
    <ProtectedRoute allowedRoles={["doctor"]}>
      <DoctorSlotManagementPage />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.BOOK_APPOINTMENT}
  element={
    <ProtectedRoute allowedRoles={["patient"]}>
      <BookAppointmentPage />
    </ProtectedRoute>
  }
/>
      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;