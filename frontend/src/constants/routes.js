export const ROUTES = {
  HOME: "/",

  LOGIN: "/login",
  ADMIN_LOGIN: "/admin/login",

  REGISTER: "/register",
  VERIFY_OTP: "/verify-otp",

  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  DOCTOR_VERIFY: "/doctor-verification",

  // PATIENT
  PATIENT_DASHBOARD: "/dashboard",
  USER_SETTINGS: "/settings",
  FIND_DOCTORS: "/doctors",
  DOCTOR_DETAILS: "/doctors/:doctorId",
  BOOK_APPOINTMENT: "/book-appointment/:doctorId",
  PAYMENT: "/payment/:appointmentId",
  PAYMENT_SUCCESS: "/payment-success/:appointmentId",
  PAYMENT_FAILED: "/payment-failed/:appointmentId",
  MY_APPOINTMENTS: "/my-appointments",
  MY_APPOINTMENT_DETAILS: "/my-appointments/:appointmentId",
  REFERRALS: "/referrals",
  // DOCTOR
  DOCTOR_DASHBOARD: "/doctor/dashboard",
  DOCTOR_SETTINGS: "/doctor/settings",
  DOCTOR_SLOTS: "/doctor/slots",
  DOCTOR_APPOINTMENTS: "/doctor/appointments",
  DOCTOR_APPOINTMENT_DETAILS: "/doctor/appointments/:appointmentId",

  // ADMIN
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_PROFILE: "/admin/profile",
  ADMIN_USERS: "/admin/users",
  ADMIN_USER_DETAILS: "/admin/users/:id",

  ADMIN_DOCTORS: "/admin/doctors",
  ADMIN_ADD_DOCTOR: "/admin/doctors/add",
  ADMIN_DOCTOR_DETAILS: "/admin/doctors/:id",
  ADMIN_EDIT_DOCTOR_FEE: "/admin/doctors/:id/edit-fee",

  ADMIN_SPECIALTIES: "/admin/specialties",
  ADMIN_APPOINTMENTS: "/admin/appointments",
  ADMIN_APPOINTMENT_DETAILS: "/admin/appointments/:appointmentId",
  ADMIN_COUPONS: "/admin/coupons",
  ADMIN_ADD_COUPON: "/admin/coupons/add",
  ADMIN_EDIT_COUPON: "/admin/coupons/:couponId/edit",
  
};