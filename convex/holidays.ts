import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listHolidays = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("holidays").collect();
    return list.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const addHoliday = mutation({
  args: {
    name: v.string(),
    date: v.string(),
    isMandatory: v.boolean(),
    description: v.optional(v.string()),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const holidayId = await ctx.db.insert("holidays", {
      name: args.name,
      date: args.date,
      isMandatory: args.isMandatory,
      description: args.description,
      createdBy: args.actorId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: "HOLIDAY_ADD",
      module: "SETTINGS",
      details: `Added statutory holiday '${args.name}' for ${args.date}`,
      timestamp: Date.now(),
    });

    return holidayId;
  },
});

export const deleteHoliday = mutation({
  args: {
    holidayId: v.id("holidays"),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.holidayId);
    if (item) {
      await ctx.db.delete(args.holidayId);
      await ctx.db.insert("audit_logs", {
        actorId: args.actorId,
        action: "HOLIDAY_DELETE",
        module: "SETTINGS",
        details: `Deleted holiday '${item.name}'`,
        timestamp: Date.now(),
      });
    }
    return { success: true };
  },
});
