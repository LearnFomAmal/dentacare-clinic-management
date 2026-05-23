import Doctor from "../../models/Doctor.js";
import DoctorSlot from "../../models/DoctorSlot.js";
import Specialty from "../../models/Specialty.js";

export const findActiveSpecialties = () => {
  return Specialty.find({
    status: "active",
  }).select("_id name displayName status");
};

export const findActiveSpecialtyById = (specialtyId) => {
  return Specialty.findOne({
    _id: specialtyId,
    status: "active",
  }).select("_id name displayName status");
};

export const countPublicDoctors = (filter) => {
  return Doctor.countDocuments(filter);
};

export const findPublicDoctors = ({
  filter,
  skip,
  limit,
  sort,
}) => {
  return Doctor.find(filter)
    .select(
      "_id firstName lastName email specialization professionalInfo settings stats accountStatus createdAt"
    )
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

export const findPublicDoctorById = (doctorId, activeSpecialtyIds) => {
  return Doctor.findOne({
    _id: doctorId,
    "accountStatus.isVerified": true,
    "accountStatus.isBlocked": false,
    "accountStatus.isDeleted": false,
    "specialization.specialtyId": {
      $in: activeSpecialtyIds,
    },
  })
    .select(
      "_id firstName lastName email specialization professionalInfo stats accountStatus createdAt"
    )
    .lean();
};

export const findSlotDayByDoctorAndDate = (doctorId, date) => {
  return DoctorSlot.findOne({
    doctorId,
    date,
  });
};

export const createDoctorSlotDay = (payload) => {
  return DoctorSlot.create(payload);
};

export const saveDoctorSlotDay = (slotDay) => {
  return slotDay.save();
};