import AppError from "../../shared/errors/AppError.js";


// CREATE SPECIALTY VALIDATION
export const validateCreateSpecialtyInput = (
  data
) => {

  const {
    name,
    description,
  } = data;

  if (
    !name ||
    typeof name !== "string"
  ) {
    throw new AppError(
      "Specialty name is required",
      400
    );
  }

  if (!name.trim()) {
    throw new AppError(
      "Specialty name cannot be empty",
      400
    );
  }

  if (
    name.trim().length < 2 ||
    name.trim().length > 50
  ) {
    throw new AppError(
      "Specialty name must be between 2 and 50 characters",
      400
    );
  }

  const specialtyRegex =
    /^[A-Za-z\s&-]+$/;

  if (
    !specialtyRegex.test(
      name.trim()
    )
  ) {
    throw new AppError(
      "Specialty name contains invalid characters",
      400
    );
  }

  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    throw new AppError(
      "Description must be string",
      400
    );
  }

  if (
    description &&
    description.length > 500
  ) {
    throw new AppError(
      "Description too long",
      400
    );
  }
};


// UPDATE SPECIALTY VALIDATION
export const validateUpdateSpecialtyInput = (
  data
) => {

  if (
    !data ||
    Object.keys(data).length === 0
  ) {
    throw new AppError(
      "No update data provided",
      400
    );
  }

  if (data.name !== undefined) {

    if (
      typeof data.name !== "string" ||
      !data.name.trim()
    ) {
      throw new AppError(
        "Specialty name is required",
        400
      );
    }

    if (
      data.name.trim().length < 2 ||
      data.name.trim().length > 50
    ) {
      throw new AppError(
        "Specialty name must be between 2 and 50 characters",
        400
      );
    }
  }

  if (
    data.description !== undefined
  ) {

    if (
      typeof data.description !==
      "string"
    ) {
      throw new AppError(
        "Description must be string",
        400
      );
    }

    if (
      data.description.length > 500
    ) {
      throw new AppError(
        "Description too long",
        400
      );
    }
  }
};


// STATUS VALIDATION
export const validateSpecialtyStatus = (
  status
) => {
  if (
    !["active", "inactive"].includes(status)
  ) {
    throw new AppError(
      "Invalid specialty status",
      400
    );
  }
};