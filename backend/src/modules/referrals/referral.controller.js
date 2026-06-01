import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  getAdminReferralsService,
  getMyReferralHistoryService,
  getMyReferralService,
  getReferralConfigService,
  updateReferralConfigService,
} from "./referral.service.js";

const getPatientId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

const getAdminId = (req) => {
  return req.admin?.adminId || req.admin?._id || req.admin?.id;
};

export const getMyReferralController = asyncHandler(async (req, res) => {
  const userId = getPatientId(req);

  const data = await getMyReferralService({
    userId,
  });

  sendResponse(
    res,
    200,
    true,
    "Referral details fetched successfully",
    data
  );
});

export const getMyReferralHistoryController = asyncHandler(
  async (req, res) => {
    const userId = getPatientId(req);

    const data = await getMyReferralHistoryService({
      userId,
    });

    sendResponse(
      res,
      200,
      true,
      "Referral history fetched successfully",
      data
    );
  }
);

export const getAdminReferralsController = asyncHandler(
  async (req, res) => {
    const data = await getAdminReferralsService({
      query: req.query,
    });

    sendResponse(
      res,
      200,
      true,
      "Admin referrals fetched successfully",
      data
    );
  }
);

export const getReferralConfigController = asyncHandler(
  async (req, res) => {
    const data = await getReferralConfigService();

    sendResponse(
      res,
      200,
      true,
      "Referral config fetched successfully",
      data
    );
  }
);

export const updateReferralConfigController = asyncHandler(
  async (req, res) => {
    const adminId = getAdminId(req);

    const data = await updateReferralConfigService({
      adminId,
      body: req.body,
    });

    sendResponse(
      res,
      200,
      true,
      "Referral config updated successfully",
      data
    );
  }
);