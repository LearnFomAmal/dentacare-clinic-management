import Notification from "../../models/Notification.js";

export const createNotification = (payload) => {
  return Notification.create(payload);
};

export const findNotifications = ({ filter, skip, limit }) => {
  return Notification.find(filter)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countNotifications = (filter) => {
  return Notification.countDocuments(filter);
};

export const countUnreadNotifications = (filter) => {
  return Notification.countDocuments({
    ...filter,
    isRead: false,
  });
};

export const findNotificationForRecipient = ({
  notificationId,
  recipientRole,
  recipientId,
}) => {
  const filter = {
    _id: notificationId,
    recipientRole,
    isDeleted: false,
  };

  if (recipientRole === "admin") {
    filter.$or = [
      {
        recipientId: null,
      },
      {
        recipientId,
      },
    ];
  } else {
    filter.recipientId = recipientId;
  }

  return Notification.findOne(filter);
};

export const markAllNotificationsAsRead = ({ filter }) => {
  return Notification.updateMany(
    {
      ...filter,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
};