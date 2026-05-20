import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import AppError from "../shared/errors/AppError.js";
import { findAdminById } from "../modules/admin/admin.repository.js";

export const protectAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.adminAccessToken;

    if (!token) {
      return next(new AppError("Unauthorized access", 401));
    }

    const decoded = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET
    );

    if (decoded.role !== "admin") {
      return next(new AppError("Admin access only", 403));
    }

    if (!decoded.adminId) {
      return next(new AppError("Invalid admin token", 401));
    }

    const admin = await findAdminById(decoded.adminId);

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    if (admin.accountStatus?.isDeleted) {
      return next(new AppError("Admin account deleted", 403));
    }

    if (admin.accountStatus?.isBlocked) {
      return next(new AppError("Admin account blocked", 403));
    }

    req.admin = {
      adminId: decoded.adminId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};