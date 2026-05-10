import AppError from "../shared/errors/AppError.js";

export const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    const currentRole =
      req.user?.role ||
      req.admin?.role ||
      req.doctor?.role;

    if (!currentRole) {
      return next(
        new AppError(
          "Unauthorized access",
          401
        )
      );
    }

    if (!roles.includes(currentRole)) {
      return next(
        new AppError(
          "Access denied: insufficient permissions",
          403
        )
      );
    }

    next();
  };