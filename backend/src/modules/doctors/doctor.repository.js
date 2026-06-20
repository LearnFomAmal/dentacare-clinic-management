import Doctor from "../../models/Doctor.js";

export const createDoctor = (payload) => {
  return Doctor.create(payload);
};

export const findDoctorByEmail = (email) => {
  return Doctor.findOne({
    email,
  });
};

export const findDoctorByEmailWithPassword = (email) => {
  return Doctor.findOne({
    email,
  }).select("+password");
};

export const findDoctorById = (doctorId) => {
  return Doctor.findById(doctorId);
};

export const findDoctorByIdWithPassword = (doctorId) => {
  return Doctor.findById(doctorId).select("+password");
};

export const updateDoctorById = (doctorId, payload) => {
  return Doctor.findByIdAndUpdate(doctorId, payload, {
    new: true,
    runValidators: true,
  }).select("-password");
};

export const softDeleteDoctorById = (doctorId) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "accountStatus.isDeleted": true,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};

export const blockDoctorById = (doctorId) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "accountStatus.isBlocked": true,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};

export const unblockDoctorById = (doctorId) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "accountStatus.isBlocked": false,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};

// ==============================
// ADMIN GET ALL DOCTORS
// ==============================
export const getAllDoctors = async (filters, options) => {
  const query = {
    "accountStatus.isDeleted": false,
  };

  if (filters.specialization) {
    query["specialization.specialtyId"] = filters.specialization;
  }

  if (filters.experience) {
    query["professionalInfo.experience"] = {
      $gte: Number(filters.experience),
    };
  }

  if (filters.rating) {
    query["stats.averageRating"] = {
      $gte: Number(filters.rating),
    };
  }

  if (filters.fee) {
    query["professionalInfo.consultationFee"] = {
      $lte: Number(filters.fee),
    };
  }

  if (filters.search) {
    query.$or = [
      {
        firstName: {
          $regex: filters.search,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: filters.search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: filters.search,
          $options: "i",
        },
      },
    ];
  }

  if (filters.status === "blocked") {
    query["accountStatus.isBlocked"] = true;
  }

  if (filters.status === "unblocked") {
    query["accountStatus.isBlocked"] = false;
  }

  if (filters.verificationStatus) {
    query["verification.status"] = filters.verificationStatus;
  }

  if (filters.professionalStatus === "verified") {
    query["accountStatus.isVerified"] = true;
  }

  if (filters.professionalStatus === "unverified") {
    query["accountStatus.isVerified"] = false;
  }

  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const sortField = options.sortBy || "createdAt";
  const sortOrder = options.order === "asc" ? 1 : -1;

  const sort = {
    [sortField]: sortOrder,
  };

  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Doctor.countDocuments(query),
  ]);

  return {
    data: doctors,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const findDoctorDetailsById = async (doctorId) => {
  return Doctor.findOne({
    _id: doctorId,
    "accountStatus.isDeleted": false,
  })
    .select("-password")
    .lean();
};

export const updateDoctorConsultationFeeById = async (
  doctorId,
  consultationFee
) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "professionalInfo.consultationFee": consultationFee,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};

export const countDoctorsBySpecialtyId = (specialtyId) => {
  return Doctor.countDocuments({
    "specialization.specialtyId": specialtyId,
    "accountStatus.isDeleted": false,
  });
};

export const updateDoctorProfileImageById = (doctorId, profileImage) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "professionalInfo.profileImage": profileImage,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};

// ==============================
// DOCTOR VERIFICATION
// ==============================
export const findDoctorsForVerification = async ({
  status,
  page,
  limit,
}) => {
  const query = {
    "accountStatus.isDeleted": false,
  };

  if (status) {
    query["verification.status"] = status;
  } else {
    query["verification.status"] = {
      $in: ["not_submitted", "pending", "approved", "rejected"],
    };
  }

  const skip = (page - 1) * limit;

  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .select("-password")
      .sort({
        "verification.submittedAt": -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Doctor.countDocuments(query),
  ]);

  return {
    doctors,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const updateDoctorVerificationDocumentsById = ({
  doctorId,
  payload,
  allowedStatuses = ["not_submitted", "rejected"],
}) => {
  return Doctor.findOneAndUpdate(
    {
      _id: doctorId,
      "verification.status": {
        $in: allowedStatuses,
      },
      "accountStatus.isDeleted": false,
      "accountStatus.isBlocked": false,
    },
    payload,
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};

export const approveDoctorVerificationById = ({ doctorId, adminId }) => {
  return Doctor.findOneAndUpdate(
    {
      _id: doctorId,
      "verification.status": "pending",
      "accountStatus.isDeleted": false,
      "accountStatus.isBlocked": false,
    },
    {
      "accountStatus.isVerified": true,

      "verification.status": "approved",
      "verification.reviewedAt": new Date(),
      "verification.reviewedBy": adminId,
      "verification.rejectionReason": "",
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};

export const rejectDoctorVerificationById = ({
  doctorId,
  adminId,
  rejectionReason,
  blockDoctor = false,
}) => {
  return Doctor.findOneAndUpdate(
    {
      _id: doctorId,
      "verification.status": "pending",
      "accountStatus.isDeleted": false,
    },
    {
      "accountStatus.isVerified": false,
      "accountStatus.isBlocked": Boolean(blockDoctor),

      "verification.status": "rejected",
      "verification.reviewedAt": new Date(),
      "verification.reviewedBy": adminId,
      "verification.rejectionReason": rejectionReason,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};