import Specialty from "../../models/Specialty.js";
import Doctor from "../../models/Doctor.js";

// ==============================
// CREATE SPECIALTY
// ==============================
export const createSpecialty = (payload) => {
  return Specialty.create(payload);
};

// ==============================
// FIND SPECIALTY BY NAME
// ==============================
export const findSpecialtyByName = (name) => {
  return Specialty.findOne({
    name,
  });
};

// ==============================
// FIND SPECIALTY BY ID
// ==============================
export const findSpecialtyById = (specialtyId) => {
  return Specialty.findById(specialtyId);
};

// ==============================
// GET ALL SPECIALTIES
// ==============================
export const getAllSpecialties = () => {
  return Specialty.find()
    .sort({
      createdAt: -1,
    })
    .lean();
};

// ==============================
// GET ALL ACTIVE SPECIALTIES
// ==============================
export const getAllActiveSpecialties = () => {
  return Specialty.find({
    status: "active",
  })
    .sort({
      displayName: 1,
    })
    .lean();
};

// ==============================
// UPDATE SPECIALTY
// ==============================
export const updateSpecialtyById = (specialtyId, payload) => {
  return Specialty.findByIdAndUpdate(specialtyId, payload, {
    new: true,
    runValidators: true,
  });
};

// ==============================
// DELETE SPECIALTY
// ==============================
export const deleteSpecialtyById = (specialtyId) => {
  return Specialty.findByIdAndDelete(specialtyId);
};

// ==============================
// SYNC DOCTOR SPECIALTY SNAPSHOT
// Important because doctors store embedded specialty name/displayName
// ==============================
export const syncDoctorSpecialtySnapshot = ({
  specialtyId,
  name,
  displayName,
}) => {
  return Doctor.updateMany(
    {
      "specialization.specialtyId": specialtyId,
      "accountStatus.isDeleted": false,
    },
    {
      $set: {
        "specialization.name": name,
        "specialization.displayName": displayName,
      },
    }
  );
};