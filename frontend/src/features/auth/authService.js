import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

// ==============================
// LOGIN
// ==============================
export const loginApi = async (payload) => {
  const { accountType, email, password } = payload;

  let endpoint = API_ENDPOINTS.AUTH.LOGIN;

  if (accountType === "doctor") {
    endpoint = API_ENDPOINTS.DOCTOR.LOGIN;
  }

  if (accountType === "admin") {
    endpoint = API_ENDPOINTS.ADMIN.LOGIN;
  }

  const response = await axiosInstance.post(endpoint, {
    email,
    password,
  });

  return response.data;
};

// ==============================
// USER REGISTER
// ==============================
export const registerApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.AUTH.REGISTER,
    payload
  );

  return response.data;
};

export const verifyRegisterOtpApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.AUTH.REGISTER_VERIFY_OTP,
    payload
  );
  
  
  return response.data;
};

export const resendRegisterOtpApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.AUTH.REGISTER_RESEND_OTP,
    payload
  );

  return response.data;
};

// ==============================
// FORGOT PASSWORD - SEND OTP
// ==============================
export const forgotPasswordApi = async ({ email, accountType }) => {
  let endpoint = API_ENDPOINTS.AUTH.FORGOT_PASSWORD;

  if (accountType === "doctor") {
    endpoint = API_ENDPOINTS.DOCTOR.FORGOT_PASSWORD;
  }

  if (accountType === "admin") {
    endpoint = API_ENDPOINTS.ADMIN.FORGOT_PASSWORD;
  }

  const response = await axiosInstance.post(endpoint, { email });

  return response.data;
};



export const resetPasswordApi = async ({
  email,
  otp,
  newPassword,
  confirmPassword,
  accountType,
}) => {
  // PATIENT: one endpoint handles OTP verification + password reset
  if (accountType === "patient") {
    const response = await axiosInstance.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY_OTP,
      {
        email,
        otp,
        newPassword,
        confirmPassword,
      }
    );

    return response.data;
  }

  // DOCTOR: one endpoint handles OTP verification + password reset
  if (accountType === "doctor") {
    const response = await axiosInstance.post(
      API_ENDPOINTS.DOCTOR.RESET_PASSWORD,
      {
        email,
        otp,
        newPassword,
        confirmPassword,
      }
    );

    return response.data;
  }

  // ADMIN: backend is two-step: verify OTP first, then reset password
  if (accountType === "admin") {
    await axiosInstance.post(API_ENDPOINTS.ADMIN.VERIFY_FORGOT_OTP, {
      email,
      otp,
    });

    const response = await axiosInstance.post(
      API_ENDPOINTS.ADMIN.RESET_PASSWORD,
      {
        email,
        password: newPassword,
      }
    );

    return response.data;
  }

  throw new Error("Invalid account type");
};
// ==============================
// RESEND FORGOT PASSWORD OTP
// ==============================
export const resendForgotPasswordOtpApi = async (payload) => {
  const { accountType, email } = payload;

  if (accountType === "patient") {
    const response = await axiosInstance.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD_RESEND_OTP,
      {
        email,
      }
    );

    return response.data;
  }

  if (accountType === "doctor") {
    const response = await axiosInstance.post(
      API_ENDPOINTS.DOCTOR.RESEND_FORGOT_PASSWORD_OTP,
      {
        email,
      }
    );

    return response.data;
  }

  if (accountType === "admin") {
    const response = await axiosInstance.post(
      API_ENDPOINTS.ADMIN.RESEND_FORGOT_OTP,
      {
        email,
      }
    );

    return response.data;
  }

  throw new Error("Invalid account type");
};

// ==============================
// DOCTOR VERIFICATION
// ==============================
export const verifyDoctorAccountApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.DOCTOR.VERIFY_ACCOUNT,
    payload
  );

  return response.data;
};

export const resendDoctorVerificationOtpApi = async (payload) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.DOCTOR.RESEND_VERIFICATION_OTP,
    payload
  );

  return response.data;
};

// ==============================
// LOGOUT
// ==============================
export const logoutApi = async (accountType) => {
  let endpoint = API_ENDPOINTS.AUTH.LOGOUT;

  if (accountType === "doctor") {
    endpoint = API_ENDPOINTS.DOCTOR.LOGOUT;
  }

  if (accountType === "admin") {
    endpoint = API_ENDPOINTS.ADMIN.LOGOUT;
  }

  const response = await axiosInstance.post(endpoint);

  return response.data;
};