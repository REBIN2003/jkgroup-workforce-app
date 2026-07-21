import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. List All Roles with Permission Matrix
export const listRolesWithPermissions = query({
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    const result = [];

    for (const r of roles) {
      const perms = await ctx.db
        .query("role_permissions")
        .withIndex("by_roleId", (q) => q.eq("roleId", r._id))
        .collect();

      result.push({
        ...r,
        permissions: perms.map((p) => p.permissionCode),
      });
    }

    return result;
  },
});

// 2. Create Custom RBAC Role
export const createCustomRole = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Role name '${args.name}' already exists.`);
    }

    const roleId = await ctx.db.insert("roles", {
      name: args.name,
      description: args.description,
      isSystem: false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: "ROLE_CREATE",
      module: "RBAC",
      details: `Created custom RBAC role: ${args.name}`,
      timestamp: Date.now(),
    });

    return roleId;
  },
});

// 3. Toggle Role Permission Link
export const toggleRolePermission = mutation({
  args: {
    roleId: v.id("roles"),
    permissionCode: v.string(),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("role_permissions")
      .withIndex("by_role_perm", (q) =>
        q.eq("roleId", args.roleId).eq("permissionCode", args.permissionCode)
      )
      .first();

    if (existing) {
      // Remove permission
      await ctx.db.delete(existing._id);
    } else {
      // Add permission
      await ctx.db.insert("role_permissions", {
        roleId: args.roleId,
        permissionCode: args.permissionCode,
      });
    }

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: "PERMISSION_TOGGLE",
      module: "RBAC",
      details: `Toggled permission ${args.permissionCode} on role ID ${args.roleId}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
