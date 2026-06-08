import { Router } from "express";

import { MESSAGES } from "../shared/constants/messages.js";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import doctorRoutes from "../modules/doctors/doctor.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import specialtyRoutes from "../modules/specialties/specialty.routes.js";
import doctorSlotRoutes from "../modules/doctorSlots/doctorSlot.routes.js";
import reportRoutes from "../modules/reports/report.routes.js";
import publicDoctorRoutes from "../modules/publicDoctors/publicDoctor.routes.js";
import appointmentRoutes from "../modules/appointments/appointment.routes.js";
import paymentRoutes from "../modules/payments/payment.routes.js";
import couponRoutes from "../modules/coupons/coupon.routes.js";
import referralRoutes from "../modules/referrals/referral.routes.js";
import walletRoutes from "../modules/wallets/wallet.routes.js";
import earningRoutes from "../modules/earnings/earning.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.use("/doctors/public", publicDoctorRoutes);
router.use("/doctors/slots", doctorSlotRoutes);
router.use("/doctors", doctorRoutes);

router.use("/admin", adminRoutes);
router.use("/specialties", specialtyRoutes);
router.use("/reports", reportRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/coupons", couponRoutes);
router.use("/referrals", referralRoutes);
router.use("/wallets", walletRoutes);
router.use("/earnings", earningRoutes);

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