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
import FindDoctorsPage from "../pages/patient/FindDoctorsPage";
import DoctorDetailsPage from "../pages/patient/DoctorDetailsPage";
import BookAppointmentPage from "../pages/patient/BookAppointmentPage";
import PaymentPage from "../pages/patient/PaymentPage";
import PaymentSuccessPage from "../pages/patient/PaymentSuccessPage";
import PaymentFailedPage from "../pages/patient/PaymentFailedPage";
import MyAppointmentsPage from "../pages/patient/MyAppointmentsPage";
import MyAppointmentDetailsPage from "../pages/patient/MyAppointmentDetailsPage";

import DoctorSettingsPage from "../pages/doctor/DoctorSettingsPage";
import DoctorSlotManagementPage from "../pages/doctor/DoctorSlotManagementPage";
import DoctorAppointmentsPage from "../pages/doctor/DoctorAppointmentsPage";
import DoctorAppointmentDetailsPage from "../pages/doctor/DoctorAppointmentDetailsPage";

import AdminProfilePage from "../pages/admin/AdminProfilePage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminUserDetailsPage from "../pages/admin/AdminUserDetailsPage";
import AdminDoctorsPage from "../pages/admin/AdminDoctorsPage";
import AdminDoctorDetailsPage from "../pages/admin/AdminDoctorDetailsPage";
import AdminAddDoctorPage from "../pages/admin/AdminAddDoctorPage";
import AdminEditDoctorFeePage from "../pages/admin/AdminEditDoctorFeePage";
import AdminAppointmentsPage from "../pages/admin/AdminAppointmentsPage";
import AdminAppointmentDetailsPage from "../pages/admin/AdminAppointmentDetailsPage";
import PatientDashboardPage from "../pages/patient/PatientDashboardPage";
import DoctorDashboardPage from "../pages/doctor/DoctorDashboardPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminLoginPage from "../pages/public/AdminLoginPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />

      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
  <Route
  path={ROUTES.ADMIN_LOGIN}
  element={
    <PublicRoute>
      <AdminLoginPage />
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

      {/* PATIENT */}
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

      <Route
        path={ROUTES.BOOK_APPOINTMENT}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <BookAppointmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PAYMENT}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PAYMENT_SUCCESS}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PaymentSuccessPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PAYMENT_FAILED}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PaymentFailedPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.MY_APPOINTMENTS}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <MyAppointmentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.MY_APPOINTMENT_DETAILS}
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <MyAppointmentDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* DOCTOR */}
      <Route
        path={ROUTES.DOCTOR_SETTINGS}
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorSettingsPage />
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
        path={ROUTES.DOCTOR_APPOINTMENTS}
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorAppointmentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DOCTOR_APPOINTMENT_DETAILS}
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorAppointmentDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* ADMIN */}
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
        path={ROUTES.ADMIN_APPOINTMENTS}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAppointmentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN_APPOINTMENT_DETAILS}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAppointmentDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
  path={ROUTES.PATIENT_DASHBOARD}
  element={
    <ProtectedRoute allowedRoles={["patient"]}>
      <PatientDashboardPage />
    </ProtectedRoute>
  }
/>

<Route
  path={ROUTES.DOCTOR_DASHBOARD}
  element={
    <ProtectedRoute allowedRoles={["doctor"]}>
      <DoctorDashboardPage />
    </ProtectedRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_DASHBOARD}
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardPage />
    </ProtectedRoute>
  }
/>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;