import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  markPaymentFailedController,
  markPaymentSuccessController,
} from "./payment.controller.js";

const router = express.Router();

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