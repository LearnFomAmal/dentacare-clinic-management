import Session from "../../models/Session.js";

export const createSession = (payload) => {
  return Session.create(payload);
};

export const findSessionByRefreshToken = (refreshToken) => {
  return Session.findOne({ refreshToken, isRevoked: false });
};

export const revokeSessionByRefreshToken = (refreshToken) => {
  return Session.findOneAndUpdate(
    { refreshToken },
    { isRevoked: true },
    { new: true }
  );
};

export const revokeAllSessionsByUserId = (userId) => {
  return Session.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};

export const updateSessionRefreshToken = (oldRefreshToken, newRefreshToken) => {
  return Session.findOneAndUpdate(
    { refreshToken: oldRefreshToken, isRevoked: false },
    {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    { new: true }
  );
};

export const countActiveSessionsByUserId = (userId) => {
  return Session.countDocuments({ userId, isRevoked: false });
};

export const deleteOldestSessionByUserId = async (userId) => {
  const oldest = await Session.findOne({ userId, isRevoked: false }).sort({
    createdAt: 1,
  });

  if (oldest) {
    await Session.findByIdAndDelete(oldest._id);
  }
};