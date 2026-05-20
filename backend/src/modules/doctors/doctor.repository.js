import Doctor from "../../models/Doctor.js";

export const createDoctor = (payload) =>{
  return Doctor.create(payload)
}

export const findDoctorByEmail = (email) =>{
    return Doctor.findOne({email})
}

export const findDoctorByEmailWithPassword = (email) =>{
    return Doctor.findOne({email}).select("+password")
}

export const findDoctorById = (doctorId) =>{
  return Doctor.findById(doctorId)
}

export const updateDoctorById = (doctorId,payload) => {
    return Doctor.findByIdAndUpdate(doctorId,payload,{
  new: true,
  runValidators: true,
}
)
}

export const softDeleteDoctorById = (doctorId) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "accountStatus.isDeleted": true,
    },
    {
      returnDocument: "after",
    }
  );
};

export const blockDoctorById = (doctorId) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "accountStatus.isBlocked": true,
    },
    {
      returnDocument: "after",
    }
  );
};

export const unblockDoctorById = (doctorId) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "accountStatus.isBlocked": false,
    },
    {
      returnDocument: "after",
    }
  );
};


// GET ALL DOCTORS


export const getAllDoctors = async (filters, options) => {
  const query = {
    "accountStatus.isDeleted": false,
  };

  // 🔍 SPECIALIZATION
  if (filters.specialization) {
    query.specialization = filters.specialization;
  }

  // 🔍 EXPERIENCE (min experience filter)
  if (filters.experience) {
    query["professionalInfo.experience"] = { $gte: Number(filters.experience) };
  }

  // 🔍 RATING (min rating filter)
  if (filters.rating) {
    query["stats.averageRating"] = { $gte: Number(filters.rating) };
  }

  // 🔍 FEE (max fee filter example)
  if (filters.fee) {
    query["professionalInfo.consultationFee"] = { $lte: Number(filters.fee) };
  }

  // 🔍 SEARCH (name)
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
];
  }

  // 🔒 BLOCK / UNBLOCK
  if (filters.status === "blocked") {
    query["accountStatus.isBlocked"] = true;
  }

  if (filters.status === "unblocked") {
    query["accountStatus.isBlocked"] = false;
  }

  // =========================
  // 📌 PAGINATION LOGIC
  // =========================
  const page = options.page;
  const limit = options.limit;
  const skip = (page - 1) * limit;

  // =========================
  // 📌 SORTING LOGIC
  // =========================
  const sortField = options.sortBy;
  const sortOrder = options.order === "asc" ? 1 : -1;

  const sort = {
    [sortField]: sortOrder,
  };

  // =========================
  // 🔥 EXECUTE QUERY
  // =========================
  const doctors = await Doctor.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Doctor.countDocuments(query);

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

export const verifyDoctorById = (doctorId) => {
  return Doctor.findByIdAndUpdate(
    doctorId,
    {
      "accountStatus.isVerified": true,
    },
    {
      returnDocument: "after",
    }
  );
};



export const findDoctorDetailsById = async (doctorId) => {
  return Doctor.findOne({
    _id: doctorId,
    "accountStatus.isDeleted": false,
  }).select("-password");
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
    }
  ).select("-password");
};

export const countDoctorsBySpecialtyId = (specialtyId) => {
  return Doctor.countDocuments({
    "specialization.specialtyId": specialtyId,
    "accountStatus.isDeleted": false,
  });
};

export const updateDoctorProfileImageById = (
  doctorId,
  profileImage
) => {
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