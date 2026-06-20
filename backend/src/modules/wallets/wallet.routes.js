import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  getMyWalletController,
  getMyWalletTransactionsController,
  createWalletRazorpayOrderController,
  verifyWalletRazorpayTopupController,
  cancelWalletRazorpayTopupController,
} from "./wallet.controller.js";

const router = express.Router();

router.get("/me", protect, getMyWalletController);

router.get(
  "/transactions",
  protect,
  getMyWalletTransactionsController
);

router.post(
  "/razorpay/create-order",
  protect,
  createWalletRazorpayOrderController
);

router.post(
  "/razorpay/verify",
  protect,
  verifyWalletRazorpayTopupController
);

router.patch(
  "/razorpay/cancel",
  protect,
  cancelWalletRazorpayTopupController
);

export default router;