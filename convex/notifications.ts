import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List Unread or All User Notifications
export const listUserNotifications = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => q.eq("userId", args.userId!))
      .collect();

    return notifications.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Mark Notification as Read
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
    return { success: true };
  },
});

// Mark All Notifications Read for User
export const markAllRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();

    for (const n of list) {
      await ctx.db.patch(n._id, { isRead: true });
    }

    return { success: true };
  },
});
