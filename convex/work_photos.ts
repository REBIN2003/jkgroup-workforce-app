import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const uploadWorkPhoto = mutation({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    attendanceId: v.optional(v.id("attendance")),
    storageId: v.id("_storage"),
    photoType: v.union(v.literal("clock_in"), v.literal("clock_out"), v.literal("site_work")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const photoId = await ctx.db.insert("work_photos", {
      userId: args.userId,
      projectId: args.projectId,
      attendanceId: args.attendanceId,
      storageId: args.storageId,
      photoType: args.photoType,
      notes: args.notes,
      timestamp: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "WORK_PHOTO_UPLOAD",
      module: "ATTENDANCE",
      details: `Captured work photo (${args.photoType})`,
      timestamp: Date.now(),
    });

    return photoId;
  },
});

export const listWorkPhotos = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let photos = await ctx.db.query("work_photos").collect();

    if (args.userId) {
      photos = photos.filter((p) => p.userId === args.userId);
    }

    const result = [];
    for (const p of photos) {
      const u = await ctx.db.get(p.userId);
      const proj = p.projectId ? await ctx.db.get(p.projectId) : null;
      const url = await ctx.storage.getUrl(p.storageId);

      result.push({
        ...p,
        userName: u?.fullName || "Unknown",
        employeeId: u?.employeeId || "N/A",
        projectName: proj?.name || "General Working Site",
        fileUrl: url,
      });
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  },
});
