import { v } from "convex/values";
import { query } from "./_generated/server";

export const listAuditLogs = query({
  args: {
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db.query("audit_logs").collect();

    if (args.module) {
      logs = logs.filter((l) => l.module === args.module);
    }

    const result = [];
    for (const l of logs) {
      const actor = l.actorId ? await ctx.db.get(l.actorId) : null;
      result.push({
        ...l,
        actorName: actor ? `${actor.fullName} (${actor.employeeId})` : "System / Guest",
      });
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  },
});
