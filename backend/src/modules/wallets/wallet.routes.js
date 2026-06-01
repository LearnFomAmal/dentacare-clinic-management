import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  getMyWalletController,
  getMyWalletTransactionsController,
  topupWalletController,
} from "./wallet.controller.js";

const router = express.Router();

router.get("/me", protect, getMyWalletController);

router.get(
  "/transactions",
  protect,
  getMyWalletTransactionsController
);

router.post("/topup", protect, topupWalletController);

export default router;