import asyncHandler from "../../shared/utils/asyncHandler.js";

import { sendResponse } from "../../shared/utils/response.js";

import {
  validateCreateSpecialtyInput,
  validateUpdateSpecialtyInput,
  validateSpecialtyStatus,
} from "./specialty.validator.js";

import {
  createSpecialtyService,
  getAllSpecialtiesService,
  updateSpecialtyService,
  updateSpecialtyStatusService,
  getAllActiveSpecialtiesService
} from "./specialty.service.js";


// CREATE SPECIALTY
export const createSpecialtyController =
  asyncHandler(async (req, res) => {
    validateCreateSpecialtyInput(
      req.body
    );

    const specialty =
      await createSpecialtyService(
        req.body
      );

    sendResponse(
      res,
      201,
      true,
      "Specialty created successfully",
      specialty
    );
  });


// GET ALL SPECIALTIES
export const getAllSpecialtiesController =
  asyncHandler(async (req, res) => {
    const specialties =
      await getAllSpecialtiesService();

    sendResponse(
      res,
      200,
      true,
      "Specialties fetched successfully",
      specialties
    );
  });


// UPDATE SPECIALTY
export const updateSpecialtyController =
  asyncHandler(async (req, res) => {
    validateUpdateSpecialtyInput(
      req.body
    );

    const updatedSpecialty =
      await updateSpecialtyService(
        req.params.id,
        req.body
      );

    sendResponse(
      res,
      200,
      true,
      "Specialty updated successfully",
      updatedSpecialty
    );
  });


// UPDATE STATUS
export const updateSpecialtyStatusController =
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    validateSpecialtyStatus(status);

    const updatedSpecialty =
      await updateSpecialtyStatusService(
        req.params.id,
        status
      );

    sendResponse(
      res,
      200,
      true,
      "Specialty status updated successfully",
      updatedSpecialty
    );
  });

  export const getAllActiveSpecialtiesController =
  asyncHandler(async (req, res) => {

    const specialties =
      await getAllActiveSpecialtiesService();

    sendResponse(
      res,
      200,
      true,
      "Active specialties fetched successfully",
      specialties
    );
  });