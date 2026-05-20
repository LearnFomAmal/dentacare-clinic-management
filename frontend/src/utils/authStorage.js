const VALID_ACCOUNT_TYPES = ["patient", "doctor", "admin"];

const getUserKey = (accountType) => {
  if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
    throw new Error("Invalid account type");
  }

  return `dentacare_${accountType}_user`;
};

const ACTIVE_ACCOUNT_TYPE_KEY = "dentacare_active_account_type";

// ==============================
// ROLE-SPECIFIC USER STORAGE
// ==============================
export const saveAuthUser = (data, accountType) => {
  const finalAccountType = accountType || data?.role || data?.accountType;

  if (!VALID_ACCOUNT_TYPES.includes(finalAccountType)) {
    throw new Error("Invalid account type while saving user");
  }

  localStorage.setItem(
    getUserKey(finalAccountType),
    JSON.stringify({
      ...data,
      role: finalAccountType,
      accountType: finalAccountType,
    })
  );
};

export const getAuthUser = (accountType = null) => {
  try {
    const finalAccountType = accountType || getAccountType();

    if (!VALID_ACCOUNT_TYPES.includes(finalAccountType)) {
      return null;
    }

    const user = localStorage.getItem(getUserKey(finalAccountType));

    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const clearAuthUser = (accountType = null) => {
  if (accountType && VALID_ACCOUNT_TYPES.includes(accountType)) {
    localStorage.removeItem(getUserKey(accountType));
    return;
  }

  VALID_ACCOUNT_TYPES.forEach((type) => {
    localStorage.removeItem(getUserKey(type));
  });
};

// ==============================
// TAB-SPECIFIC ACTIVE ROLE
// ==============================
export const saveAccountType = (accountType) => {
  if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
    throw new Error("Invalid account type");
  }

  sessionStorage.setItem(ACTIVE_ACCOUNT_TYPE_KEY, accountType);
};

export const getAccountType = () => {
  return sessionStorage.getItem(ACTIVE_ACCOUNT_TYPE_KEY);
};

export const clearAccountType = () => {
  sessionStorage.removeItem(ACTIVE_ACCOUNT_TYPE_KEY);
};

// Clears only one role if accountType is passed.
// Clears all roles only if no accountType is passed.
export const clearAuthStorage = (accountType = null) => {
  if (accountType) {
    clearAuthUser(accountType);

    if (getAccountType() === accountType) {
      clearAccountType();
    }

    return;
  }

  clearAuthUser();
  clearAccountType();
};

// ==============================
// PENDING REGISTER
// ==============================
export const savePendingRegisterEmail = (email) => {
  sessionStorage.setItem("dentacare_pending_register_email", email);
};

export const getPendingRegisterEmail = () => {
  return sessionStorage.getItem("dentacare_pending_register_email");
};

export const clearPendingRegisterEmail = () => {
  sessionStorage.removeItem("dentacare_pending_register_email");
};

// ==============================
// PENDING FORGOT PASSWORD
// ==============================
export const savePendingForgotPasswordData = (data) => {
  sessionStorage.setItem(
    "dentacare_pending_forgot_password",
    JSON.stringify(data)
  );
};

export const getPendingForgotPasswordData = () => {
  try {
    const data = sessionStorage.getItem("dentacare_pending_forgot_password");
    return data ? JSON.parse(data) : null;
  } catch {
    sessionStorage.removeItem("dentacare_pending_forgot_password");
    return null;
  }
};

export const clearPendingForgotPasswordData = () => {
  sessionStorage.removeItem("dentacare_pending_forgot_password");
};