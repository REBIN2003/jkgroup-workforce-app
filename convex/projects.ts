import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Create Project
export const createProject = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    code: v.string(),
    projectManagerId: v.optional(v.id("users")),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    status: v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("on_hold")
    ),
    budget: v.optional(v.number()),
    description: v.optional(v.string()),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const projId = await ctx.db.insert("projects", {
      companyId: args.companyId,
      name: args.name,
      code: args.code,
      projectManagerId: args.projectManagerId,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      budget: args.budget,
      description: args.description,
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: "CREATE_PROJECT",
      module: "PROJECTS",
      details: `Created enterprise project ${args.name} (${args.code})`,
      timestamp: Date.now(),
    });

    return projId;
  },
});

// 2. List All Projects
export const listProjects = query({
  args: {
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let projs = await ctx.db.query("projects").collect();

    if (args.companyId) {
      projs = projs.filter((p) => p.companyId === args.companyId);
    }
    if (args.status) {
      projs = projs.filter((p) => p.status === args.status);
    }

    const result = [];
    for (const p of projs) {
      const comp = await ctx.db.get(p.companyId);
      const pm = p.projectManagerId ? await ctx.db.get(p.projectManagerId) : null;

      result.push({
        ...p,
        companyName: comp?.name || "N/A",
        projectManagerName: pm?.fullName || "Unassigned",
      });
    }

    return result;
  },
});
