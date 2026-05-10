import Session from "../../models/Session.js";

export const createSession = (payload) => {
  return Session.create(payload);
};

export const findSessionByRefreshToken = (refreshToken) => {
  return Session.findOne({
    refreshToken,
    isRevoked: false,
  });
};

export const revokeSessionByRefreshToken = (refreshToken) => {
  return Session.findOneAndUpdate(
    {
      refreshToken,
      isRevoked: false,
    },
    {
      isRevoked: true,
    },
    {
      new: true,
    }
  );
};

export const revokeAllSessionsByUserId = (
  userId,
  userType
) => {
  return Session.updateMany(
    {
      userId,
      userType,
      isRevoked: false,
    },
    {
      isRevoked: true,
    }
  );
};

export const updateSessionRefreshToken = (
  oldRefreshToken,
  newRefreshToken
) => {
  return Session.findOneAndUpdate(
    {
      refreshToken: oldRefreshToken,
      isRevoked: false,
    },
    {
      refreshToken: newRefreshToken,
      expiresAt: new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
      ),
    },
    {
      new: true,
    }
  );
};

export const countActiveSessionsByUserId = (
  userId,
  userType
) => {
  return Session.countDocuments({
    userId,
    userType,
    isRevoked: false,
  });
};

export const revokeOldestSessionByUserId = async (
  userId,
  userType
) => {

  const oldest =
    await Session.findOne({
      userId,
      userType,
      isRevoked: false,
    }).sort({
      createdAt: 1,
    });

  if (oldest) {
    oldest.isRevoked = true;
    await oldest.save();
  }
};