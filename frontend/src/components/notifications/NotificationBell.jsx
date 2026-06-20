import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { ROUTES } from "../../constants/routes";

import {
  clearNotificationError,
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../features/notification/notificationSlice";

const getNotificationTargetPath = ({ notification, role }) => {
  const referenceType = notification?.referenceType;
  const referenceId = notification?.referenceId;

  if (!referenceId) {
    if (role === "admin") return ROUTES.ADMIN_DASHBOARD;
    if (role === "doctor") return ROUTES.DOCTOR_DASHBOARD;
    return ROUTES.PATIENT_DASHBOARD;
  }
       if (referenceType === "doctor") {
    if (role === "admin") {
      return ROUTES.ADMIN_DOCTOR_DETAILS.replace(":id", referenceId);
    }

    if (role === "doctor") {
      return ROUTES.DOCTOR_VERIFICATION_STATUS;
    }

    return ROUTES.PATIENT_DASHBOARD;
  }
  if (referenceType === "appointment") {
    if (role === "admin") {
      return ROUTES.ADMIN_APPOINTMENT_DETAILS.replace(
        ":appointmentId",
        referenceId
      );
    }

    if (role === "doctor") {
      return ROUTES.DOCTOR_APPOINTMENT_DETAILS.replace(
        ":appointmentId",
        referenceId
      );
    }

    return ROUTES.MY_APPOINTMENT_DETAILS.replace(
      ":appointmentId",
      referenceId
    );
  }

  if (referenceType === "review") {
    if (role === "admin") {
      return ROUTES.ADMIN_REVIEWS;
    }

    if (role === "doctor") {
      return ROUTES.DOCTOR_REVIEWS;
    }

    return ROUTES.MY_REVIEWS;
  }

  if (referenceType === "referral") {
    return ROUTES.REFERRALS;
  }

  if (referenceType === "payment") {
    if (role === "patient") {
      return ROUTES.MY_APPOINTMENTS;
    }

    if (role === "admin") {
      return ROUTES.ADMIN_APPOINTMENTS;
    }

    return ROUTES.DOCTOR_APPOINTMENTS;
  }

  if (referenceType === "report") {
    if (role === "doctor") {
      return ROUTES.DOCTOR_APPOINTMENTS;
    }

    return ROUTES.MY_APPOINTMENTS;
  }

  if (role === "admin") return ROUTES.ADMIN_DASHBOARD;
  if (role === "doctor") return ROUTES.DOCTOR_DASHBOARD;

  return ROUTES.PATIENT_DASHBOARD;
};

const formatNotificationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTypeBadgeClass = (type) => {
  if (type?.includes("approved") || type?.includes("completed")) {
    return "bg-green-50 text-green-700";
  }

  if (
    type?.includes("rejected") ||
    type?.includes("cancelled") ||
    type?.includes("failed")
  ) {
    return "bg-red-50 text-red-700";
  }

  if (type?.includes("review")) {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-[#F0F1FF] text-[#9381FF]";
};

function NotificationBell({ role }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    isUpdating,
    error,
  } = useAppSelector((state) => state.notifications);

  const [open, setOpen] = useState(false);

  const visibleUnreadCount = useMemo(() => {
    if (unreadCount > 99) return "99+";
    return unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!role) return;

    dispatch(fetchUnreadNotificationCount(role));

    const intervalId = window.setInterval(() => {
      dispatch(fetchUnreadNotificationCount(role));
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dispatch, role]);

  useEffect(() => {
    if (!open || !role) return;

    dispatch(
      fetchNotifications({
        role,
        params: {
          page: 1,
          limit: 15,
        },
      })
    );
  }, [dispatch, open, role]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearNotificationError());
  }, [error, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!open) return;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

const handleMarkAllRead = async () => {
  try {
    await dispatch(markAllNotificationsRead(role)).unwrap();

    await dispatch(
      fetchNotifications({
        role,
        params: {
          page: 1,
          limit: 15,
        },
      })
    ).unwrap();

    await dispatch(fetchUnreadNotificationCount(role)).unwrap();

    toast.success("All notifications marked as read");
  } catch (err) {
    toast.error(err || "Failed to update notifications");
  }
};

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await dispatch(
          markNotificationRead({
            role,
            notificationId: notification._id,
          })
        ).unwrap();
      }

      const targetPath = getNotificationTargetPath({
        notification,
        role,
      });

      setOpen(false);
      navigate(targetPath);
    } catch (err) {
      toast.error(err || "Failed to open notification");
    }
  };

  const handleDelete = async (event, notificationId) => {
    event.stopPropagation();

    try {
      await dispatch(
        deleteNotification({
          role,
          notificationId,
        })
      ).unwrap();

      toast.success("Notification removed");
    } catch (err) {
      toast.error(err || "Failed to delete notification");
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#EEF0F6] bg-white text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        title="Notifications"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-extrabold text-white">
            {visibleUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-[110] w-[360px] overflow-hidden rounded-3xl border border-[#EEF0F6] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-900 sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-[#EEF0F6] px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-[#111827] dark:text-white">
                Notifications
              </h2>

              <p className="mt-1 text-xs font-bold text-[#6B7280] dark:text-slate-400">
                {unreadCount} unread
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isUpdating || unreadCount === 0}
                onClick={handleMarkAllRead}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF] transition hover:bg-[#E6E7FF] disabled:cursor-not-allowed disabled:opacity-40"
                title="Mark all as read"
              >
                <CheckCheck size={17} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#6B7280] transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="max-h-[430px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm font-bold text-[#6B7280]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
                  <Bell size={24} />
                </div>

                <h3 className="mt-4 text-base font-extrabold text-[#111827] dark:text-white">
                  No notifications
                </h3>

                <p className="mt-2 text-sm text-[#6B7280] dark:text-slate-400">
                  New updates will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF0F6] dark:divide-slate-800">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDelete={(event) =>
                      handleDelete(event, notification._id)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-[#EEF0F6] bg-[#F8FAFC] px-5 py-3 text-center dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold text-[#6B7280] dark:text-slate-400">
                Showing latest {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onClick, onDelete }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full px-5 py-4 text-left transition hover:bg-[#F8FAFC] dark:hover:bg-slate-800 ${
        !notification.isRead ? "bg-[#F8F7FF]" : "bg-white dark:bg-slate-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
            notification.isRead ? "bg-[#CBD5E1]" : "bg-[#9381FF]"
          }`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-sm font-extrabold text-[#111827] dark:text-white">
              {notification.title}
            </h3>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold capitalize ${getTypeBadgeClass(
                notification.type
              )}`}
            >
              {String(notification.referenceType || "update").replace(
                "_",
                " "
              )}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6B7280] dark:text-slate-400">
            {notification.message}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9CA3AF]">
              <Clock size={12} />
              {formatNotificationTime(notification.createdAt)}
            </span>

            <span
              role="button"
              tabIndex={0}
              onClick={onDelete}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onDelete(event);
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[#9CA3AF] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              title="Delete notification"
            >
              <Trash2 size={14} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default NotificationBell;