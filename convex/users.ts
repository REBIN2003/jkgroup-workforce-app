import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { seedDatabase } from "./seed";

// Seed System Admin & Default Roles
export const seedSystemAdmin = seedDatabase;

// List Roles
export const listRoles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roles").collect();
  },
});

// List Users
export const listUsers = query({
  args: {
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const users = args.companyId
      ? await ctx.db
          .query("users")
          .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId!))
          .collect()
      : await ctx.db.query("users").collect();

    const result = [];
    for (const u of users) {
      const role = await ctx.db.get(u.roleId);
      const company = u.companyId ? await ctx.db.get(u.companyId) : null;
      let imageUrl = undefined;
      if (u.profileImageStorageId) {
        imageUrl = await ctx.storage.getUrl(u.profileImageStorageId);
      }

      result.push({
        ...u,
        roleName: role?.name || "Unknown Role",
        companyName: company?.name || "N/A",
        profileImageUrl: imageUrl || undefined,
      });
    }

    return result;
  },
});

// Get User Profile by ID
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const role = await ctx.db.get(user.roleId);
    const company = user.companyId ? await ctx.db.get(user.companyId) : null;
    let imageUrl = undefined;
    if (user.profileImageStorageId) {
      imageUrl = await ctx.storage.getUrl(user.profileImageStorageId);
    }

    return {
      ...user,
      roleName: role?.name || "Unknown Role",
      companyName: company?.name || "N/A",
      profileImageUrl: imageUrl || undefined,
    };
  },
});

// Update Profile Details (Personal, Address, Emergency Contact, Profile Picture)
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    fullName: v.string(),
    phone: v.optional(v.string()),
    profileImageStorageId: v.optional(v.id("_storage")),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        country: v.string(),
      })
    ),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phone: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User record not found");

    await ctx.db.patch(args.userId, {
      fullName: args.fullName,
      phone: args.phone,
      profileImageStorageId: args.profileImageStorageId || user.profileImageStorageId,
      address: args.address,
      emergencyContact: args.emergencyContact,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "UPDATE_PROFILE",
      module: "PROFILE",
      details: `Updated personal profile information for ${user.employeeId}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Update Bank & Tax Details
export const updateBankAndTaxDetails = mutation({
  args: {
    userId: v.id("users"),
    bankDetails: v.optional(
      v.object({
        bankName: v.string(),
        accountNumber: v.string(),
        iban: v.string(),
        swift: v.string(),
      })
    ),
    taxDetails: v.optional(
      v.object({
        taxId: v.string(),
        taxCategory: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User record not found");

    await ctx.db.patch(args.userId, {
      bankDetails: args.bankDetails,
      taxDetails: args.taxDetails,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "UPDATE_BANK_TAX",
      module: "PROFILE",
      details: `Updated bank and tax information for ${user.employeeId}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Create User
export const createUser = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    employeeId: v.string(),
    roleId: v.id("roles"),
    companyId: v.optional(v.id("companies")),
    phone: v.optional(v.string()),
    password: v.string(),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existingEmail) {
      throw new Error("User with this corporate email already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      fullName: args.fullName,
      employeeId: args.employeeId,
      roleId: args.roleId,
      companyId: args.companyId,
      phone: args.phone,
      passwordHash: args.password,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: "CREATE_USER",
      module: "USERS",
      details: `Created user account ${normalizedEmail} (${args.employeeId})`,
      timestamp: Date.now(),
    });

    return userId;
  },
});

// Update User
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    fullName: v.string(),
    phone: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    roleId: v.id("roles"),
    companyId: v.optional(v.id("companies")),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      fullName: args.fullName,
      phone: args.phone,
      status: args.status,
      roleId: args.roleId,
      companyId: args.companyId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Delete User
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
    return { success: true };
  },
});
