import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Save / Update Weekly Timesheet (Draft or Submit)
export const saveTimesheet = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    projectId: v.optional(v.id("projects")),
    year: v.number(),
    weekNumber: v.number(),
    dailyHours: v.object({
      mon: v.number(),
      tue: v.number(),
      wed: v.number(),
      thu: v.number(),
      fri: v.number(),
      sat: v.number(),
      sun: v.number(),
    }),
    expenses: v.optional(v.number()),
    travelKm: v.optional(v.number()),
    description: v.optional(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const totalHours =
      args.dailyHours.mon +
      args.dailyHours.tue +
      args.dailyHours.wed +
      args.dailyHours.thu +
      args.dailyHours.fri +
      args.dailyHours.sat +
      args.dailyHours.sun;

    const existing = await ctx.db
      .query("time_registrations")
      .withIndex("by_user_year_week", (q) =>
        q
          .eq("userId", args.userId)
          .eq("year", args.year)
          .eq("weekNumber", args.weekNumber)
      )
      .first();

    let timesheetId;

    if (existing) {
      if (existing.status === "approved") {
        throw new Error("Approved timesheets cannot be modified.");
      }

      await ctx.db.patch(existing._id, {
        projectId: args.projectId,
        dailyHours: args.dailyHours,
        totalHours,
        expenses: args.expenses,
        travelKm: args.travelKm,
        description: args.description,
        attachmentStorageId: args.attachmentStorageId || existing.attachmentStorageId,
        status: args.status,
        submittedAt: args.status === "submitted" ? Date.now() : existing.submittedAt,
      });
      timesheetId = existing._id;
    } else {
      timesheetId = await ctx.db.insert("time_registrations", {
        userId: args.userId,
        companyId: args.companyId,
        projectId: args.projectId,
        year: args.year,
        weekNumber: args.weekNumber,
        dailyHours: args.dailyHours,
        totalHours,
        expenses: args.expenses,
        travelKm: args.travelKm,
        description: args.description,
        attachmentStorageId: args.attachmentStorageId,
        status: args.status,
        submittedAt: args.status === "submitted" ? Date.now() : undefined,
        createdAt: Date.now(),
      });
    }

    if (args.status === "submitted") {
      await ctx.db.insert("approval_logs", {
        entityType: "timesheet",
        entityId: timesheetId,
        actorId: args.userId,
        action: "submit",
        comment: `Submitted weekly timesheet for Year ${args.year}, Week ${args.weekNumber} (${totalHours} hrs)`,
        timestamp: Date.now(),
      });
    }

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: `TIMESHEET_${args.status.toUpperCase()}`,
      module: "TIME_REGISTRATION",
      details: `Saved timesheet for Week ${args.weekNumber}/${args.year} with ${totalHours} total hours`,
      timestamp: Date.now(),
    });

    return timesheetId;
  },
});

// 2. Get Single Timesheet for User by Week & Year
export const getTimesheet = query({
  args: {
    userId: v.id("users"),
    year: v.number(),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const timesheet = await ctx.db
      .query("time_registrations")
      .withIndex("by_user_year_week", (q) =>
        q
          .eq("userId", args.userId)
          .eq("year", args.year)
          .eq("weekNumber", args.weekNumber)
      )
      .first();

    if (!timesheet) return null;

    let projName = "General Working Hours";
    if (timesheet.projectId) {
      const proj = await ctx.db.get(timesheet.projectId);
      if (proj) projName = proj.name;
    }

    let attachmentUrl = undefined;
    if (timesheet.attachmentStorageId) {
      attachmentUrl = await ctx.storage.getUrl(timesheet.attachmentStorageId);
    }

    return {
      ...timesheet,
      projectName: projName,
      attachmentUrl: attachmentUrl || undefined,
    };
  },
});

// 3. List Timesheets (for Manager Review or User History)
export const listTimesheets = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let list = await ctx.db.query("time_registrations").collect();

    if (args.userId) {
      list = list.filter((t) => t.userId === args.userId);
    }
    if (args.status) {
      list = list.filter((t) => t.status === args.status);
    }

    const result = [];
    for (const t of list) {
      const u = await ctx.db.get(t.userId);
      const proj = t.projectId ? await ctx.db.get(t.projectId) : null;
      let url = undefined;
      if (t.attachmentStorageId) {
        url = await ctx.storage.getUrl(t.attachmentStorageId);
      }

      result.push({
        ...t,
        userName: u?.fullName || "Unknown",
        employeeId: u?.employeeId || "N/A",
        projectName: proj?.name || "General Working Hours",
        attachmentUrl: url || undefined,
      });
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  },
});
