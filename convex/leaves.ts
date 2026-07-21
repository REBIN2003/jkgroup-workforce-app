import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Submit Leave Request
export const createLeaveRequest = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    leaveType: v.union(
      v.literal("annual"),
      v.literal("sick"),
      v.literal("casual"),
      v.literal("unpaid")
    ),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const leaveId = await ctx.db.insert("leave_requests", {
      userId: args.userId,
      companyId: args.companyId,
      leaveType: args.leaveType,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.insert("approval_logs", {
      entityType: "leave",
      entityId: leaveId,
      actorId: args.userId,
      action: "submit",
      comment: `Submitted ${args.leaveType} leave request from ${args.startDate} to ${args.endDate}`,
      timestamp: Date.now(),
    });

    return leaveId;
  },
});

// 2. Update Leave Request Status (Approve / Reject)
export const updateLeaveStatus = mutation({
  args: {
    leaveId: v.id("leave_requests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    actorId: v.id("users"),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.leaveId);
    if (!request) throw new Error("Leave request not found");

    await ctx.db.patch(args.leaveId, {
      status: args.status,
      approvedBy: args.actorId,
    });

    await ctx.db.insert("approval_logs", {
      entityType: "leave",
      entityId: args.leaveId,
      actorId: args.actorId,
      action: args.status === "approved" ? "approve" : "reject",
      comment: args.comment || `Leave request ${args.status}`,
      timestamp: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: `LEAVE_${args.status.toUpperCase()}`,
      module: "LEAVE",
      details: `${args.status.toUpperCase()} leave request for user ID ${request.userId}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// 3. List Leave Requests
export const listLeaveRequests = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let requests = await ctx.db.query("leave_requests").collect();

    if (args.userId) {
      requests = requests.filter((r) => r.userId === args.userId);
    }
    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }

    const result = [];
    for (const r of requests) {
      const u = await ctx.db.get(r.userId);
      const approver = r.approvedBy ? await ctx.db.get(r.approvedBy) : null;
      result.push({
        ...r,
        userName: u?.fullName || "Unknown",
        employeeId: u?.employeeId || "N/A",
        approverName: approver?.fullName || "N/A",
      });
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  },
});
