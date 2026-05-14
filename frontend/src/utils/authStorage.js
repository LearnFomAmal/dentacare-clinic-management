export const saveAuthUser = (data) => {
  localStorage.setItem("dentacare_user", JSON.stringify(data));
};

export const getAuthUser = () => {
  const user = localStorage.getItem("dentacare_user");

  return user ? JSON.parse(user) : null;
};

export const clearAuthUser = () => {
  localStorage.removeItem("dentacare_user");
};

export const saveAccountType = (accountType) => {
  localStorage.setItem("dentacare_account_type", accountType);
};

export const getAccountType = () => {
  return localStorage.getItem("dentacare_account_type");
};

export const clearAccountType = () => {
  localStorage.removeItem("dentacare_account_type");
};

export const savePendingRegisterEmail = (email) => {
    localStorage.setItem("dentacare_pending_register_email", email);
};

export const getPendingRegisterEmail = () => {
    localStorage.getItem("dentacare_pending_register_email");
}

export const clearPendingRegisterEmail = () => {
    localStorage.removeItem("dentacare_pending_register_email");
};


export const savePendingForgotPasswordData = (data) => {
  sessionStorage.setItem(
    "dentacare_pending_forgot_password",
    JSON.stringify(data)
  );
};

export const getPendingForgotPasswordData = () => {
  const data = sessionStorage.getItem("dentacare_pending_forgot_password");

  return data ? JSON.parse(data) : null;
};

export const clearPendingForgotPasswordData = () => {
  sessionStorage.removeItem("dentacare_pending_forgot_password");
};

