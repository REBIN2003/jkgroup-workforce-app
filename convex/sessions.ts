import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listActiveSessions = query({
  handler: async (ctx) => {
    const active = await ctx.db.query("sessions").collect();
    const result = [];

    for (const s of active) {
      const u = await ctx.db.get(s.userId);
      const role = u?.roleId ? await ctx.db.get(u.roleId) : null;

      result.push({
        ...s,
        userName: u?.fullName || "Unknown",
        userEmail: u?.email || "N/A",
        employeeId: u?.employeeId || "N/A",
        roleName: role?.name || "User",
        isExpired: Date.now() > s.expiresAt,
      });
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const revokeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.sessionId);
    if (s) {
      await ctx.db.delete(args.sessionId);
      await ctx.db.insert("audit_logs", {
        actorId: args.actorId,
        action: "SESSION_REVOKE",
        module: "SECURITY",
        details: `Force revoked active session token for user ID ${s.userId}`,
        timestamp: Date.now(),
      });
    }
    return { success: true };
  },
});
