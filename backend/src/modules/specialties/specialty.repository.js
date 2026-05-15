import Specialty from "../../models/Specialty.js";


// CREATE SPECIALTY
export const createSpecialty = (payload) => {
  return Specialty.create(payload);
};


// FIND BY NAME
export const findSpecialtyByName = (name) => {
  return Specialty.findOne({
    name: name.trim().toLowerCase(),
  });
};

// FIND BY ID
export const findSpecialtyById = (id) => {
  return Specialty.findById(id);
};


// GET ALL SPECIALTIES
export const getAllSpecialties = () => {
  return Specialty.find()
    .select(
      "_id displayName name description status createdAt"
    )
    .sort({
      displayName: 1,
    });
};

// UPDATE SPECIALTY
export const updateSpecialtyById = (
  id,
  payload
) => {

  return Specialty.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const getAllActiveSpecialties = () => {
  return Specialty.find({
    status: "active",
  })
    .sort({
      displayName: 1,
    })
    .select("_id displayName name description status");
};