import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  createRazorpayOrderService,
  markPaymentFailedService,
  markPaymentSuccessService,
  verifyRazorpayPaymentService,
} from "./payment.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

export const createRazorpayOrderController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientId(req);

    const result = await createRazorpayOrderService({
      patientId,
      body: req.body,
    });

    sendResponse(
      res,
      201,
      true,
      "Razorpay order created successfully",
      result
    );
  }
);

export const verifyRazorpayPaymentController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientId(req);

    const result = await verifyRazorpayPaymentService({
      patientId,
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Payment verified successfully. Appointment submitted for approval.",
      result
    );
  }
);

export const markPaymentSuccessController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientId(req);

    const result = await markPaymentSuccessService({
      patientId,
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Payment successful. Appointment submitted for approval.",
      result
    );
  }
);

export const markPaymentFailedController = asyncHandler(
  async (req, res) => {
    const patientId = getPatientId(req);

    const result = await markPaymentFailedService({
      patientId,
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Payment failure recorded successfully",
      result
    );
  }
);