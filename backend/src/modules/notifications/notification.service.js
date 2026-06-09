import mongoose from "mongoose";

import AppError from "../../shared/errors/AppError.js";

import {
  countNotifications,
  countUnreadNotifications,
  createNotification,
  findNotificationForRecipient,
  findNotifications,
  markAllNotificationsAsRead,
} from "./notification.repository.js";

import {
  validateNotificationPayload,
  validateObjectId,
  validatePagination,
  validateRecipientRole,
} from "./notification.validator.js";

const buildRecipientFilter = ({ recipientRole, recipientId }) => {
  validateRecipientRole(recipientRole);

  const filter = {
    recipientRole,
    isDeleted: false,
  };

  if (recipientRole === "admin") {
    filter.$or = [
      {
        recipientId: null,
      },
      {
        recipientId: new mongoose.Types.ObjectId(recipientId),
      },
    ];

    return filter;
  }

  filter.recipientId = new mongoose.Types.ObjectId(recipientId);

  return filter;
};

export const createNotificationService = async (payload) => {
  validateNotificationPayload(payload);

  return createNotification({
    recipientId: payload.recipientId
      ? new mongoose.Types.ObjectId(payload.recipientId)
      : null,

    recipientRole: payload.recipientRole,

    actorId: payload.actorId
      ? new mongoose.Types.ObjectId(payload.actorId)
      : null,

    actorRole: payload.actorRole || "",
    actorName: payload.actorName || "",
    actorProfileImage: payload.actorProfileImage || "",

    type: payload.type,
    title: payload.title.trim(),
    message: payload.message.trim(),

    referenceType: payload.referenceType || "",
    referenceId: payload.referenceId
      ? new mongoose.Types.ObjectId(payload.referenceId)
      : null,
  });
};

export const createAdminNotificationService = async (payload) => {
  return createNotificationService({
    ...payload,
    recipientRole: "admin",
    recipientId: null,
  });
};

export const safeCreateNotification = async (payload) => {
  try {
    return await createNotificationService(payload);
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

export const safeCreateAdminNotification = async (payload) => {
  try {
    return await createAdminNotificationService(payload);
  } catch (error) {
    console.error("Admin notification creation failed:", error.message);
    return null;
  }
};

export const getNotificationsService = async ({
  recipientRole,
  recipientId,
  query,
}) => {
  validateObjectId(recipientId, `${recipientRole} id`);

  const { page, limit } = validatePagination(query);
  const skip = (page - 1) * limit;

  const filter = buildRecipientFilter({
    recipientRole,
    recipientId,
  });

  const [notifications, totalNotifications, unreadCount] =
    await Promise.all([
      findNotifications({
        filter,
        skip,
        limit,
      }),
      countNotifications(filter),
      countUnreadNotifications(filter),
    ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      totalNotifications,
      totalPages: Math.ceil(totalNotifications / limit),
    },
  };
};

export const getUnreadNotificationCountService = async ({
  recipientRole,
  recipientId,
}) => {
  validateObjectId(recipientId, `${recipientRole} id`);

  const filter = buildRecipientFilter({
    recipientRole,
    recipientId,
  });

  const unreadCount = await countUnreadNotifications(filter);

  return {
    unreadCount,
  };
};

export const markNotificationAsReadService = async ({
  recipientRole,
  recipientId,
  notificationId,
}) => {
  validateObjectId(recipientId, `${recipientRole} id`);
  validateObjectId(notificationId, "notification id");

  const notification = await findNotificationForRecipient({
    notificationId,
    recipientRole,
    recipientId,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();
  }

  return notification;
};

export const markAllNotificationsAsReadService = async ({
  recipientRole,
  recipientId,
}) => {
  validateObjectId(recipientId, `${recipientRole} id`);

  const filter = buildRecipientFilter({
    recipientRole,
    recipientId,
  });

  await markAllNotificationsAsRead({
    filter,
  });

  return {
    markedAsRead: true,
  };
};

export const deleteNotificationService = async ({
  recipientRole,
  recipientId,
  notificationId,
}) => {
  validateObjectId(recipientId, `${recipientRole} id`);
  validateObjectId(notificationId, "notification id");

  const notification = await findNotificationForRecipient({
    notificationId,
    recipientRole,
    recipientId,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  notification.isDeleted = true;
  notification.deletedAt = new Date();

  await notification.save();

  return {
    _id: notification._id,
  };
};