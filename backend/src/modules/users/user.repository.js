import User from "../../models/User.js";

export const findUserByEmail = (email) => {
  return User.findOne({ email });
};

export const findUserByReferralCode = (referralCode) => {
  return User.findOne({ "referral.referralCode": referralCode });
};

export const createUser = (payload) => {
  return User.create(payload);
};

export const findUserById = (id) => {
  return User.findById(id);
};

export const findUserByEmailWithPassword = (email) => {
  return User.findOne({ email }).select("+password");
};

export const updateUserPasswordByEmail = (email, hashedPassword) => {
  return User.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true }
  );
};

export const updateUserById = (id, payload) => {
  return User.findByIdAndUpdate(id, payload, { new: true });
};

export const softDeleteUserById = (id) => {
  return User.findByIdAndUpdate(
    id,
    {
      "accountStatus.isDeleted": true,
    },
    { new: true }
  );
};

export const findActiveUserById = (id) => {
  return User.findOne({
    _id: id,
    "accountStatus.isDeleted": false,
  });
};



export const getAllPatients = async (filters, options) => {
  const query = {
    role: "patient",
    "accountStatus.isDeleted": false,
  };

  // 🔍 SEARCH BY NAME
  if (filters.search) {
    query.username = { $regex: filters.search, $options: "i" };
  }

  // 🔒 BLOCK / UNBLOCK FILTER
  if (filters.status === "blocked") {
    query["accountStatus.isBlocked"] = true;
  }

  if (filters.status === "unblocked") {
    query["accountStatus.isBlocked"] = false;
  }

  // ======================
  // PAGINATION
  // ======================
  const page = options.page;
  const limit = options.limit;
  const skip = (page - 1) * limit;

  // ======================
  // SORTING
  // ======================
  const sortField = options.sortBy;
  const sortOrder = options.order === "asc" ? 1 : -1;

  const sort = {
    [sortField]: sortOrder,
  };

  const patients = await User.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-password");

  const total = await User.countDocuments(query);

  return {
    data: patients,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};


export const findPatientByIdForAdmin = async (userId) => {
  return User.findOne({
    _id: userId,
    role: "patient",
    "accountStatus.isDeleted": false,
  }).select("-password");
};

export const blockUserById = (userId) => {
  return User.findByIdAndUpdate(
    userId,
    {
      "accountStatus.isBlocked": true,
    },
    {
      new: true,
    }
  );
};

// ==============================
// ADMIN UNBLOCK PATIENT
// ==============================
export const unblockUserById = (userId) => {
  return User.findByIdAndUpdate(
    userId,
    {
      "accountStatus.isBlocked": false,
    },
    {
      new: true,
    }
  );
};