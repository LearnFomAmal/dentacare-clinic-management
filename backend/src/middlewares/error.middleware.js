import { env } from "../config/env.js";

export const errorHandler = (
  err,
  req,
  res,
  next
) => {
  const statusCode =
    err.statusCode || 500;

  const message =
    err.message ||
    "Internal Server Error";

  // Optional logging for development
  if (env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};