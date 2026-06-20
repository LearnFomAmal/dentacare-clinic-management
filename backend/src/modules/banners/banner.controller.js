import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendResponse } from "../../shared/utils/response.js";

import {
  createBannerService,
  deleteBannerService,
  getAdminBannerDetailsService,
  getAdminBannersService,
  getPublicBannersByLocationService,
  updateBannerService,
  updateBannerStatusService,
} from "./banner.service.js";

export const createBannerController = asyncHandler(async (req, res) => {
  const banner = await createBannerService({
    adminId: req.admin?.adminId,
    body: req.body,
    file: req.file,
  });

  sendResponse(
    res,
    201,
    true,
    "Banner created successfully",
    banner
  );
});

export const getAdminBannersController = asyncHandler(async (req, res) => {
  const result = await getAdminBannersService({
    query: req.query,
  });

  sendResponse(
    res,
    200,
    true,
    "Banners fetched successfully",
    result
  );
});

export const getAdminBannerDetailsController = asyncHandler(
  async (req, res) => {
    const banner = await getAdminBannerDetailsService({
      bannerId: req.params.bannerId,
    });

    sendResponse(
      res,
      200,
      true,
      "Banner details fetched successfully",
      banner
    );
  }
);

export const updateBannerController = asyncHandler(async (req, res) => {
  const banner = await updateBannerService({
    bannerId: req.params.bannerId,
    body: req.body,
    file: req.file,
  });

  sendResponse(
    res,
    200,
    true,
    "Banner updated successfully",
    banner
  );
});

export const updateBannerStatusController = asyncHandler(async (req, res) => {
  const banner = await updateBannerStatusService({
    bannerId: req.params.bannerId,
    body: req.body,
  });

  sendResponse(
    res,
    200,
    true,
    "Banner status updated successfully",
    banner
  );
});

export const deleteBannerController = asyncHandler(async (req, res) => {
  const banner = await deleteBannerService({
    bannerId: req.params.bannerId,
  });

  sendResponse(
    res,
    200,
    true,
    "Banner deleted successfully",
    banner
  );
});

export const getHomeBannersController = asyncHandler(async (req, res) => {
  const banners = await getPublicBannersByLocationService({
    location: "home",
  });

  sendResponse(
    res,
    200,
    true,
    "Home banners fetched successfully",
    banners
  );
});

export const getDoctorPageBannersController = asyncHandler(async (req, res) => {
  const banners = await getPublicBannersByLocationService({
    location: "doctors",
  });

  sendResponse(
    res,
    200,
    true,
    "Doctor page banners fetched successfully",
    banners
  );
});