import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  createWalletRazorpayOrderService,
  getMyWalletService,
  getMyWalletTransactionsService,
  verifyWalletRazorpayTopupService,
  cancelWalletRazorpayTopupService,
} from "./wallet.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

export const getMyWalletController = asyncHandler(async (req, res) => {
  const data = await getMyWalletService({
    userId: getPatientId(req),
  });

  sendResponse(res, 200, true, "Wallet fetched successfully", data);
});

export const getMyWalletTransactionsController = asyncHandler(
  async (req, res) => {
    const data = await getMyWalletTransactionsService({
      userId: getPatientId(req),
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Wallet transactions fetched successfully",
      data
    );
  }
);


export const createWalletRazorpayOrderController = asyncHandler(
  async (req, res) => {
    const data = await createWalletRazorpayOrderService({
      userId: getPatientId(req),
      body: req.body,
    });

    sendResponse(
      res,
      201,
      true,
      "Wallet Razorpay order created successfully",
      data
    );
  }
);

export const verifyWalletRazorpayTopupController = asyncHandler(
  async (req, res) => {
    const data = await verifyWalletRazorpayTopupService({
      userId: getPatientId(req),
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Wallet topped up successfully",
      data
    );
  }
);

export const cancelWalletRazorpayTopupController = asyncHandler(
  async (req, res) => {
    const data = await cancelWalletRazorpayTopupService({
      userId: getPatientId(req),
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Wallet top-up cancelled successfully",
      data
    );
  }
);