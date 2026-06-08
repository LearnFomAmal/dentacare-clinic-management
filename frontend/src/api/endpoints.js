export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    GOOGLE_LOGIN: "/auth/google-login",
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
    UPDATE_PROFILE_IMAGE: "/users/me/profile-image",
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
    REFRESH_TOKEN: "/admin/refresh-token",
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
    UPDATE_PROFILE_IMAGE: "/doctors/me/profile-image",
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

    SLOTS: {
      GET_ALL: "/doctors/slots",
      ADD: "/doctors/slots",
      APPLY_RECURRING: "/doctors/slots/recurring",
      UPDATE: (slotDayId, slotId) =>
        `/doctors/slots/${slotDayId}/slots/${slotId}`,
      DELETE: (slotDayId, slotId) =>
        `/doctors/slots/${slotDayId}/slots/${slotId}`,
      MARK_HOLIDAY: (slotDayId) =>
  `/doctors/slots/${slotDayId}/holiday`,

UNDO_HOLIDAY: (slotDayId) =>
  `/doctors/slots/${slotDayId}/undo-holiday`,
RESTORE_DEFAULTS: (slotDayId) =>
  `/doctors/slots/${slotDayId}/restore-defaults`,
    },

    PUBLIC: {
      GET_ALL: "/doctors/public",
      GET_DETAILS: (doctorId) => `/doctors/public/${doctorId}`,
      AVAILABLE_SLOTS: (doctorId) =>
        `/doctors/public/${doctorId}/available-slots`,
    },
  },

  SPECIALTY: {
    CREATE: "/specialties",
    GET_ALL: "/specialties",
    GET_ACTIVE_PUBLIC: "/specialties/public",
    UPDATE: (id) => `/specialties/${id}`,
    UPDATE_STATUS: (id) => `/specialties/${id}/status`,
    DELETE: (id) => `/specialties/${id}`,
  },

    REPORT: {
    BOOKING_UPLOAD: "/reports/booking-upload",
    DRAFTS: "/reports/drafts",
    DELETE_DRAFT: (reportId) => `/reports/drafts/${reportId}`,

    DOCTOR_UPLOAD_PRESCRIPTION: (appointmentId) =>
      `/reports/doctor/prescription/${appointmentId}`,

    PATIENT_APPOINTMENT_REPORTS: (appointmentId) =>
      `/reports/patient/appointment/${appointmentId}`,

    DOCTOR_APPOINTMENT_REPORTS: (appointmentId) =>
      `/reports/doctor/appointment/${appointmentId}`,
  },

 APPOINTMENT: {
  INITIATE: "/appointments/initiate",
  DETAILS: (appointmentId) => `/appointments/${appointmentId}`,

  MY: "/appointments/my",
  MY_DETAILS: (appointmentId) => `/appointments/my/${appointmentId}`,
  MY_CANCEL: (appointmentId) => `/appointments/my/${appointmentId}/cancel`,
  MY_RESCHEDULE: (appointmentId) =>
    `/appointments/my/${appointmentId}/reschedule`,

  DOCTOR_LIST: "/appointments/doctor",
  DOCTOR_DETAILS: (appointmentId) => `/appointments/doctor/${appointmentId}`,
  DOCTOR_APPROVE: (appointmentId) =>
    `/appointments/doctor/${appointmentId}/approve`,
  DOCTOR_REJECT: (appointmentId) =>
    `/appointments/doctor/${appointmentId}/reject`,
  DOCTOR_COMPLETE: (appointmentId) =>
    `/appointments/doctor/${appointmentId}/complete`,

  ADMIN_LIST: "/appointments/admin",
  ADMIN_DETAILS: (appointmentId) => `/appointments/admin/${appointmentId}`,
  ADMIN_APPROVE: (appointmentId) =>
    `/appointments/admin/${appointmentId}/approve`,
  ADMIN_REJECT: (appointmentId) =>
    `/appointments/admin/${appointmentId}/reject`,
  ADMIN_CANCEL: (appointmentId) =>
    `/appointments/admin/${appointmentId}/cancel`,
},

PAYMENT: {
  CREATE_RAZORPAY_ORDER: "/payments/razorpay/create-order",
  VERIFY_RAZORPAY: "/payments/razorpay/verify",
  SUCCESS: "/payments/success",
  FAILED: "/payments/failed",
},

EARNINGS: {
  DOCTOR_ME: "/earnings/doctor/me",
  ADMIN_DOCTOR: (doctorId) => `/earnings/admin/doctors/${doctorId}`,
},

  COUPON: {
  AVAILABLE: "/coupons/available",
  VALIDATE: "/coupons/validate",

  ADMIN_CREATE: "/coupons/admin",
  ADMIN_GET_ALL: "/coupons/admin",
  ADMIN_GET_DETAILS: (couponId) => `/coupons/admin/${couponId}`,
  ADMIN_UPDATE: (couponId) => `/coupons/admin/${couponId}`,
  ADMIN_UPDATE_STATUS: (couponId) => `/coupons/admin/${couponId}/status`,
  ADMIN_DELETE: (couponId) => `/coupons/admin/${couponId}`,
},
REFERRAL: {
  ME: "/referrals/me",
  HISTORY: "/referrals/history",

  ADMIN_GET_ALL: "/referrals/admin",
  ADMIN_CONFIG: "/referrals/admin/config",
},
  WALLET: {
    ME: "/wallets/me",
    TRANSACTIONS: "/wallets/transactions",
    TOPUP: "/wallets/topup",
  },
};