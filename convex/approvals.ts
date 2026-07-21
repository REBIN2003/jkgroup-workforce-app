import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Approve Leave Request with Digital Signature & Lock
export const approveLeaveRequest = mutation({
  args: {
    leaveId: v.id("leave_requests"),
    actorId: v.id("users"),
    signatureStorageId: v.optional(v.id("_storage")),
    comment: v.optional(v.string()),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const leave = await ctx.db.get(args.leaveId);
    if (!leave) throw new Error("Leave request record not found.");

    await ctx.db.patch(args.leaveId, {
      status: args.status,
      approvedBy: args.actorId,
    });

    // Create Approval Log Trace
    await ctx.db.insert("approval_logs", {
      entityType: "leave",
      entityId: args.leaveId,
      actorId: args.actorId,
      action: args.status === "approved" ? "approve" : "reject",
      comment: args.comment || `Leave request ${args.status}`,
      signatureStorageId: args.signatureStorageId,
      locked: true,
      timestamp: Date.now(),
    });

    // Create Real-Time Notification for Employee
    await ctx.db.insert("notifications", {
      userId: leave.userId,
      title: `Leave Request ${args.status.toUpperCase()}`,
      message: `Your leave request for ${leave.startDate} to ${leave.endDate} was ${args.status} by management.`,
      type: args.status === "approved" ? "info" : "warning",
      isRead: false,
      link: "/leave-requests",
      createdAt: Date.now(),
    });

    // Security Audit Log
    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: `LEAVE_${args.status.toUpperCase()}`,
      module: "APPROVALS",
      details: `${args.status.toUpperCase()} leave request for employee ID ${leave.userId} (Signed)`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// 2. Approve Weekly Timesheet with Digital Signature & Lock
export const approveTimesheet = mutation({
  args: {
    timesheetId: v.id("time_registrations"),
    actorId: v.id("users"),
    signatureStorageId: v.optional(v.id("_storage")),
    comment: v.optional(v.string()),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const sheet = await ctx.db.get(args.timesheetId);
    if (!sheet) throw new Error("Timesheet record not found.");

    await ctx.db.patch(args.timesheetId, {
      status: args.status,
      approvedBy: args.actorId,
    });

    await ctx.db.insert("approval_logs", {
      entityType: "timesheet",
      entityId: args.timesheetId,
      actorId: args.actorId,
      action: args.status === "approved" ? "approve" : "reject",
      comment: args.comment || `Timesheet ${args.status}`,
      signatureStorageId: args.signatureStorageId,
      locked: true,
      timestamp: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: sheet.userId,
      title: `Timesheet ${args.status.toUpperCase()}`,
      message: `Your weekly timesheet for Year ${sheet.year}, Week ${sheet.weekNumber} was ${args.status}.`,
      type: args.status === "approved" ? "info" : "warning",
      isRead: false,
      link: "/time-registration",
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: `TIMESHEET_${args.status.toUpperCase()}`,
      module: "APPROVALS",
      details: `${args.status.toUpperCase()} timesheet Week ${sheet.weekNumber}/${sheet.year} (${sheet.totalHours} hrs)`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// 3. Query Approval History Trace for an Entity
export const getApprovalHistory = query({
  args: {
    entityType: v.union(
      v.literal("leave"),
      v.literal("document"),
      v.literal("project"),
      v.literal("timesheet"),
      v.literal("attendance"),
      v.literal("photo")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("approval_logs")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .collect();

    const result = [];
    for (const l of logs) {
      const actor = await ctx.db.get(l.actorId);
      let signatureUrl = undefined;
      if (l.signatureStorageId) {
        signatureUrl = await ctx.storage.getUrl(l.signatureStorageId);
      }

      result.push({
        ...l,
        actorName: actor?.fullName || "Unknown Manager",
        actorRole: actor?.roleId ? (await ctx.db.get(actor.roleId))?.name : "Manager",
        signatureUrl: signatureUrl || undefined,
      });
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  },
});
