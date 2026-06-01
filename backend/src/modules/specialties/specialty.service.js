import AppError from "../../shared/errors/AppError.js";

import {
  createSpecialty,
  findSpecialtyByName,
  findSpecialtyById,
  getAllSpecialties,
  updateSpecialtyById,
  syncDoctorSpecialtySnapshot,
  getAllActiveSpecialties,
  deleteSpecialtyById,
} from "./specialty.repository.js";
import { countDoctorsBySpecialtyId } from "../doctors/doctor.repository.js";
// CREATE SPECIALTY
export const createSpecialtyService =
  async (data) => {

    const {
      name,
      description,
    } = data;

    const normalizedName =
      name.trim().toLowerCase();

    const displayName =
      name.trim();

    const existingSpecialty =
      await findSpecialtyByName(
        normalizedName
      );

    if (existingSpecialty) {
      throw new AppError(
        "Specialty already exists",
        400
      );
    }

    try {

      const specialty =
        await createSpecialty({
          name: normalizedName,
          displayName,
          description:
            description?.trim() || "",
        });

      return specialty;

    } catch (error) {

      if (error.code === 11000) {
        throw new AppError(
          "Specialty already exists",
          400
        );
      }

      throw error;
    }
  };

// GET ALL SPECIALTIES
export const getAllSpecialtiesService =
  async () => {
    return getAllSpecialties();
  };


// UPDATE SPECIALTY
const normalizeSpecialtyName = (name) => {
  return name.trim().toLowerCase();
};

export const updateSpecialtyService = async (specialtyId, body) => {
  const specialty = await findSpecialtyById(specialtyId);

  if (!specialty) {
    throw new AppError("Specialty not found", 404);
  }

  const displayName = body.name.trim();
  const name = normalizeSpecialtyName(body.name);

  const updatedSpecialty = await updateSpecialtyById(specialtyId, {
    name,
    displayName,
    description: body.description || "",
  });

  await syncDoctorSpecialtySnapshot({
    specialtyId: updatedSpecialty._id,
    name: updatedSpecialty.name,
    displayName: updatedSpecialty.displayName,
  });

  return updatedSpecialty;
};

// UPDATE SPECIALTY STATUS
export const updateSpecialtyStatusService =
  async (id, status) => {
    const specialty =
      await findSpecialtyById(id);

    if (!specialty) {
      throw new AppError(
        "Specialty not found",
        404
      );
    }

  if (specialty.status === status) {
  throw new AppError(
    `Specialty already ${status}`,
    400
  );
}

    const updatedSpecialty =
      await updateSpecialtyById(
        id,
        { status }
      );

    return updatedSpecialty;
  };

 export const getAllActiveSpecialtiesService = async () => {
  return getAllActiveSpecialties();
};

export const deleteSpecialtyService = async (id) => {
  const specialty = await findSpecialtyById(id);

  if (!specialty) {
    throw new AppError("Specialty not found", 404);
  }

  const assignedDoctors = await countDoctorsBySpecialtyId(id);

  if (assignedDoctors > 0) {
    throw new AppError(
      "Cannot delete specialty because doctors are assigned to it. Deactivate it instead.",
      400
    );
  }

  await deleteSpecialtyById(id);

  return {
    _id: id,
  };
};