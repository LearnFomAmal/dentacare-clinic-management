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

    VERIFY_ACCOUNT: "/doctors/verify-account",
    RESEND_VERIFICATION_OTP: "/doctors/resend-verification-otp",

    FORGOT_PASSWORD: "/doctors/forgot-password",
    RESET_PASSWORD: "/doctors/reset-password",
    RESEND_FORGOT_PASSWORD_OTP: "/doctors/resend-forgot-password-otp",

    REFRESH_TOKEN: "/doctors/refresh-token",
  },
};