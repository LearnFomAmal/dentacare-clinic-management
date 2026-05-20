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

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const setAuthCookies = (
  res,
  accessToken,
  refreshToken,
  userType
) => {
  const names = getCookieNames(userType);

  res.cookie(names.accessToken, accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(names.refreshToken, refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export default setAuthCookies;