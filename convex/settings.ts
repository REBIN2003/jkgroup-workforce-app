import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const setSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: args.userId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        updatedBy: args.userId,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "UPDATE_SETTING",
      module: "SETTINGS",
      details: `Updated setting '${args.key}'`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const listSettings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("settings").collect();
  },
});

export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: args.actorId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        updatedBy: args.actorId,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
