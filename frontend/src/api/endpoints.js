export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",

    REGISTER: "/auth/register",
    REGISTER_RESEND_OTP: "/auth/register/resend-otp",
    REGISTER_VERIFY_OTP: "/auth/register/verify-otp",

    FORGOT_PASSWORD: "/auth/forgot-password",
    FORGOT_PASSWORD_VERIFY_OTP: "/auth/forgot-password/verify-otp",
    FORGOT_PASSWORD_RESEND_OTP: "/auth/forgot-password/resend-otp",

    REFRESH_TOKEN: "/auth/refresh-token",
    LOGOUT: "/auth/logout",
    LOGOUT_ALL: "/auth/logout-all",
  },

  USER: {
    ME: "/users/me",
    UPDATE_PROFILE: "/users/me",
    CHANGE_PASSWORD: "/users/change-password",
    DELETE_ACCOUNT: "/users/me",
    SESSIONS: "/users/sessions",
    UPDATE_THEME: "/users/theme",

    ADMIN_GET_PATIENTS: "/users/patients",
    ADMIN_GET_PATIENT_DETAILS: (id) => `/users/patients/${id}`,
    ADMIN_BLOCK_PATIENT: (id) => `/users/patients/${id}/block`,
    ADMIN_UNBLOCK_PATIENT: (id) => `/users/patients/${id}/unblock`,
  },

  ADMIN: {
    LOGIN: "/admin/login",
    LOGOUT: "/admin/logout",
    ME: "/admin/me",

    FORGOT_PASSWORD: "/admin/forgot-password",
    VERIFY_FORGOT_OTP: "/admin/verify-forgot-otp",
    RESET_PASSWORD: "/admin/reset-password",
    RESEND_FORGOT_OTP: "/admin/resend-forgot-otp",
  },

  DOCTOR: {
    LOGIN: "/doctors/login",
    LOGOUT: "/doctors/logout",

    ME: "/doctors/me",
    UPDATE_PROFILE: "/doctors/me",
    CHANGE_PASSWORD: "/doctors/change-password",
    DELETE_ACCOUNT: "/doctors/me",
    UPDATE_THEME: "/doctors/theme",
    SESSIONS: "/doctors/sessions",

    VERIFY_ACCOUNT: "/doctors/verify-account",
    RESEND_VERIFICATION_OTP: "/doctors/resend-verification-otp",

    FORGOT_PASSWORD: "/doctors/forgot-password",
    RESET_PASSWORD: "/doctors/reset-password",
    RESEND_FORGOT_PASSWORD_OTP: "/doctors/resend-forgot-password-otp",

    REFRESH_TOKEN: "/doctors/refresh-token",

    ADMIN_CREATE: "/doctors",
    ADMIN_GET_ALL: "/doctors",
    ADMIN_GET_DETAILS: (id) => `/doctors/${id}`,
    ADMIN_BLOCK: (id) => `/doctors/${id}/block`,
    ADMIN_UNBLOCK: (id) => `/doctors/${id}/unblock`,
    ADMIN_UPDATE_CONSULTATION_FEE: (id) =>
      `/doctors/${id}/consultation-fee`,
  },

  SPECIALTY: {
  CREATE: "/specialties",
  GET_ALL: "/specialties",
  GET_ACTIVE_PUBLIC: "/specialties/public",
  UPDATE: (id) => `/specialties/${id}`,
  UPDATE_STATUS: (id) => `/specialties/${id}/status`,
},

};

