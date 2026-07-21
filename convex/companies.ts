import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createCompany = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    taxId: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("companies", {
      name: args.name,
      code: args.code,
      taxId: args.taxId,
      address: args.address,
      phone: args.phone,
      email: args.email,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const listCompanies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("companies").collect();
  },
});
