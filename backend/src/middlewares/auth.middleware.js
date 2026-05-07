import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import AppError from "../shared/errors/AppError.js";
import { findUserById } from "../modules/users/user.repository.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return next(new AppError("Unauthorized access", 401));
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

    const user = await findUserById(decoded.userId);

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    if (user.accountStatus.isDeleted) {
      return next(new AppError("Account deleted", 401));
    }

    if (user.accountStatus.isBlocked) {
      return next(new AppError("Account blocked", 401));
    }

    req.user = decoded;

    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};