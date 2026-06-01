import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  getMyWalletService,
  getMyWalletTransactionsService,
  topupWalletService,
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

export const topupWalletController = asyncHandler(async (req, res) => {
  const data = await topupWalletService({
    userId: getPatientId(req),
    body: req.body,
  });

  sendResponse(res, 200, true, "Wallet topped up successfully", data);
});