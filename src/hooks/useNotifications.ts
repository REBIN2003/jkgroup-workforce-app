"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useNotifications(userId?: string) {
  const notifications = useQuery(
    api.notifications.listUserNotifications,
    userId ? { userId: userId as any } : "skip"
  ) || [];

  const markReadMut = useMutation(api.notifications.markNotificationRead);
  const markAllReadMut = useMutation(api.notifications.markAllRead);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead: markReadMut,
    markAllAsRead: markAllReadMut,
  };
}
