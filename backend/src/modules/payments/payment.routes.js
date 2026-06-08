import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
  markPaymentFailedController,
  markPaymentSuccessController,
} from "./payment.controller.js";

const router = express.Router();

// ==============================
// RAZORPAY PAYMENT ROUTES
// ==============================
router.post(
  "/razorpay/create-order",
  protect,
  createRazorpayOrderController
);

router.post(
  "/razorpay/verify",
  protect,
  verifyRazorpayPaymentController
);

// ==============================
// MANUAL / WALLET PAYMENT ROUTES
// ==============================
router.post(
  "/success",
  protect,
  markPaymentSuccessController
);

router.post(
  "/failed",
  protect,
  markPaymentFailedController
);

export default router;