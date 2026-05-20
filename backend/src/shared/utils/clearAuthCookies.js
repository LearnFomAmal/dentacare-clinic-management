import { env } from "../../config/env.js";

const COOKIE_CONFIG = {
  patient: {
    accessToken: "patientAccessToken",
    refreshToken: "patientRefreshToken",
  },

  doctor: {
    accessToken: "doctorAccessToken",
    refreshToken: "doctorRefreshToken",
  },

  admin: {
    accessToken: "adminAccessToken",
    refreshToken: "adminRefreshToken",
  },
};

const getCookieNames = (userType) => {
  const names = COOKIE_CONFIG[userType];

  if (!names) {
    throw new Error("Invalid cookie user type");
  }

  return names;
};

const clearOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const clearAuthCookies = (res, userType) => {
  const names = getCookieNames(userType);

  res.clearCookie(names.accessToken, clearOptions);
  res.clearCookie(names.refreshToken, clearOptions);
};

export default clearAuthCookies;