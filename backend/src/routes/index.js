import { Router } from "express";

import { MESSAGES } from "../shared/constants/messages.js";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import doctorRoutes from "../modules/doctors/doctor.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import specialtyRoutes from "../modules/specialties/specialty.routes.js";

const router = Router();

// ==========================================
// MODULE ROUTES
// ==========================================
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/doctors", doctorRoutes);
router.use("/admin", adminRoutes);
router.use("/specialties", specialtyRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      MESSAGES?.SERVER_RUNNING ||
      "Server is running successfully",
    timestamp: new Date().toISOString(),
  });
});

export default router;