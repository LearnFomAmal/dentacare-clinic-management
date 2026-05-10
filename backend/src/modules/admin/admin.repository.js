import Admin from "../../models/Admin.js";


// FIND ADMIN BY EMAIL
export const findAdminByEmail = (email) => {
  return Admin.findOne({ email });
};


// FIND ADMIN WITH PASSWORD
export const findAdminByEmailWithPassword = (email) => {
  return Admin.findOne({ email })
    .select("+password");
};


// FIND ADMIN BY ID
export const findAdminById = (adminId) => {
  return Admin.findById(adminId);
};


// UPDATE ADMIN BY ID
export const updateAdminById = (
  adminId,
  payload
) => {
  return Admin.findByIdAndUpdate(
    adminId,
    payload,
    {
      new: true,
    }
  );
};