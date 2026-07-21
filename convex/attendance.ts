import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate Storage Upload URL
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Clock-In Mutation
export const clockIn = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")),
    projectId: v.optional(v.id("projects")),
    photoStorageId: v.optional(v.id("_storage")),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", todayStr))
      .first();

    if (existing) {
      throw new Error("You have already clocked in for today (" + todayStr + ")");
    }

    // Resolve target companyId safely
    let targetCompanyId = args.companyId;
    if (!targetCompanyId) {
      const companyDoc = await ctx.db.query("companies").first();
      if (companyDoc) {
        targetCompanyId = companyDoc._id;
      } else {
        // Create default company if none exists
        const newCompanyId = await ctx.db.insert("companies", {
          name: "JK Group International",
          code: "JKG-001",
          status: "active",
          createdAt: Date.now(),
        });
        targetCompanyId = newCompanyId;
      }
    }

    const now = Date.now();
    const currentHour = new Date(now).getHours();
    const status = currentHour >= 9 && new Date(now).getMinutes() > 15 ? "late" : "present";

    const attendanceId = await ctx.db.insert("attendance", {
      userId: args.userId,
      companyId: targetCompanyId,
      projectId: args.projectId,
      date: todayStr,
      clockInTime: now,
      clockInPhotoId: args.photoStorageId,
      status,
      remarks: args.remarks,
      createdAt: now,
    });

    if (args.photoStorageId) {
      await ctx.db.insert("work_photos", {
        attendanceId,
        userId: args.userId,
        projectId: args.projectId,
        storageId: args.photoStorageId,
        photoType: "clock_in",
        timestamp: now,
      });
    }

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "ATTENDANCE_CLOCK_IN",
      module: "ATTENDANCE",
      details: `Clocked in for ${todayStr} at ${new Date(now).toLocaleTimeString()}`,
      timestamp: now,
    });

    return attendanceId;
  },
});

// Start Break Mutation
export const startBreak = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const todayStr = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", todayStr))
      .first();

    if (!existing) throw new Error("Must clock in before starting a break.");
    if (existing.clockOutTime) throw new Error("Already clocked out for today.");
    if (existing.status === "on_break") throw new Error("Already on break.");

    const now = Date.now();
    await ctx.db.patch(existing._id, {
      breakStartTime: now,
      status: "on_break",
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "ATTENDANCE_BREAK_START",
      module: "ATTENDANCE",
      details: `Started break at ${new Date(now).toLocaleTimeString()}`,
      timestamp: now,
    });

    return existing._id;
  },
});

// End Break Mutation
export const endBreak = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const todayStr = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", todayStr))
      .first();

    if (!existing || existing.status !== "on_break" || !existing.breakStartTime) {
      throw new Error("No active break found to end.");
    }

    const now = Date.now();
    const breakDurationMs = now - existing.breakStartTime;
    const additionalMinutes = Math.round(breakDurationMs / (1000 * 60));
    const previousMinutes = existing.totalBreakMinutes || 0;

    await ctx.db.patch(existing._id, {
      breakEndTime: now,
      totalBreakMinutes: previousMinutes + additionalMinutes,
      status: "present",
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "ATTENDANCE_BREAK_END",
      module: "ATTENDANCE",
      details: `Ended break at ${new Date(now).toLocaleTimeString()} (${additionalMinutes} mins)`,
      timestamp: now,
    });

    return existing._id;
  },
});

// Clock-Out Mutation
export const clockOut = mutation({
  args: {
    userId: v.id("users"),
    photoStorageId: v.optional(v.id("_storage")),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const todayStr = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", todayStr))
      .first();

    if (!existing) {
      throw new Error("No active clock-in record found for today to clock out.");
    }

    if (existing.clockOutTime) {
      throw new Error("You have already clocked out for today.");
    }

    // Auto-end break if clocked out while on break
    const now = Date.now();
    let totalBreak = existing.totalBreakMinutes || 0;
    if (existing.status === "on_break" && existing.breakStartTime) {
      totalBreak += Math.round((now - existing.breakStartTime) / (1000 * 60));
    }

    await ctx.db.patch(existing._id, {
      clockOutTime: now,
      totalBreakMinutes: totalBreak,
      clockOutPhotoId: args.photoStorageId || existing.clockOutPhotoId,
      status: "present",
      remarks: args.remarks ? (existing.remarks ? `${existing.remarks} | ${args.remarks}` : args.remarks) : existing.remarks,
    });

    if (args.photoStorageId) {
      await ctx.db.insert("work_photos", {
        attendanceId: existing._id,
        userId: args.userId,
        projectId: existing.projectId,
        storageId: args.photoStorageId,
        photoType: "clock_out",
        timestamp: now,
      });
    }

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "ATTENDANCE_CLOCK_OUT",
      module: "ATTENDANCE",
      details: `Clocked out for ${todayStr} at ${new Date(now).toLocaleTimeString()}`,
      timestamp: now,
    });

    return existing._id;
  },
});

// Query Today's User Attendance State
export const getTodayAttendance = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    const todayStr = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("attendance")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId!).eq("date", todayStr))
      .first();
  },
});

// List Attendance Matrix
export const listAttendanceLogs = query({
  args: {
    userId: v.optional(v.id("users")),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const logs = args.userId
      ? (args.date
          ? await ctx.db
              .query("attendance")
              .withIndex("by_user_date", (q) => q.eq("userId", args.userId!).eq("date", args.date!))
              .collect()
          : await ctx.db
              .query("attendance")
              .withIndex("by_user_date", (q) => q.eq("userId", args.userId!))
              .collect())
      : (args.date
          ? (await ctx.db.query("attendance").collect()).filter((l) => l.date === args.date)
          : await ctx.db.query("attendance").collect());

    const result = [];
    for (const l of logs) {
      const u = await ctx.db.get(l.userId);
      const proj = l.projectId ? await ctx.db.get(l.projectId) : null;
      result.push({
        ...l,
        userName: u?.fullName || "Unknown",
        employeeId: u?.employeeId || "N/A",
        projectName: proj?.name || "General Office",
      });
    }

    return result.sort((a, b) => b.clockInTime - a.clockInTime);
  },
});
