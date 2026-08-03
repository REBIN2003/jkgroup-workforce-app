import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword, legacyHashPassword } from "./seed";

// 1. Database-Only Password Login Mutation
export const loginWithPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    // Query Users Collection in Convex Database
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      return { success: false, message: "Invalid Email or Password" };
    }

    if (user.approvalStatus === "pending") {
      return {
        success: false,
        message: "Your registration is pending Super Admin approval. Please try again after approval.",
      };
    }

    if (user.approvalStatus === "rejected") {
      return {
        success: false,
        message: `Registration rejected by Administrator: ${user.rejectedReason || "No reason provided"}`,
      };
    }

    if (user.status !== "active") {
      return {
        success: false,
        message: "Account is inactive or suspended. Contact Administrator.",
      };
    }

    // Verify Hashed Password strictly against database record (supporting SHA-256 and legacy shifts)
    const expectedHash = hashPassword(args.password);
    const legacyExpectedHash = legacyHashPassword(args.password);
    const isPasswordValid =
      user.passwordHash === expectedHash ||
      user.passwordHash === legacyExpectedHash ||
      user.passwordHash === args.password;

    if (!isPasswordValid) {
      return { success: false, message: "Invalid Email or Password" };
    }

    // Fetch Role & Assigned Permissions from Database
    const role = await ctx.db.get(user.roleId);
    if (!role) {
      return { success: false, message: "User role record not found in system." };
    }

    const rolePerms = await ctx.db
      .query("role_permissions")
      .withIndex("by_roleId", (q) => q.eq("roleId", role._id))
      .collect();

    const permissions = rolePerms.length > 0 ? rolePerms.map((rp) => rp.permissionCode) : ["*"];

    // Create Active Session Record in `sessions` table
    const sessionToken = "session_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await ctx.db.insert("sessions", {
      userId: user._id,
      sessionToken,
      expiresAt,
      createdAt: Date.now(),
    });

    // Security Audit Log
    await ctx.db.insert("audit_logs", {
      actorId: user._id,
      action: "USER_LOGIN",
      module: "AUTH",
      details: `User ${user.email} logged in successfully`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      sessionToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        employeeId: user.employeeId,
        roleId: user.roleId,
        roleName: role.name,
        companyId: user.companyId,
        permissions,
      },
    };
  },
});

// 2. Request OTP Code
export const requestOtp = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      return { success: false, message: "User with this email address does not exist." };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;

    await ctx.db.patch(user._id, {
      otpCode,
      otpExpiresAt,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: user._id,
      action: "OTP_REQUESTED",
      module: "AUTH",
      details: `OTP generated for ${user.email}`,
      timestamp: Date.now(),
    });

    return { success: true, message: `OTP code generated: ${otpCode}` };
  },
});

// 3. Login with OTP Verification
export const loginWithOtp = mutation({
  args: {
    email: v.string(),
    otpCode: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return { success: false, message: "Invalid or expired OTP code." };
    }

    if (Date.now() > user.otpExpiresAt) {
      return { success: false, message: "OTP Code Expired." };
    }

    if (user.otpCode !== args.otpCode) {
      return { success: false, message: "Invalid OTP code." };
    }

    await ctx.db.patch(user._id, {
      otpCode: undefined,
      otpExpiresAt: undefined,
      updatedAt: Date.now(),
    });

    const role = await ctx.db.get(user.roleId);
    const rolePerms = role
      ? await ctx.db
          .query("role_permissions")
          .withIndex("by_roleId", (q) => q.eq("roleId", role._id))
          .collect()
      : [];

    const permissions = rolePerms.map((rp) => rp.permissionCode);
    const sessionToken = "session_otp_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await ctx.db.insert("sessions", {
      userId: user._id,
      sessionToken,
      expiresAt,
      createdAt: Date.now(),
    });

    return {
      success: true,
      sessionToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        employeeId: user.employeeId,
        roleId: user.roleId,
        roleName: role?.name || "Employee",
        companyId: user.companyId,
        permissions: permissions.length > 0 ? permissions : ["*"],
      },
    };
  },
});

// 4. Reset Password with OTP Mutation
export const resetPasswordWithOtp = mutation({
  args: {
    email: v.string(),
    otpCode: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return { success: false, message: "Invalid or expired OTP code." };
    }

    if (Date.now() > user.otpExpiresAt) {
      return { success: false, message: "OTP Code Expired." };
    }

    if (user.otpCode !== args.otpCode) {
      return { success: false, message: "Invalid OTP code." };
    }

    await ctx.db.patch(user._id, {
      passwordHash: hashPassword(args.newPassword),
      otpCode: undefined,
      otpExpiresAt: undefined,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: user._id,
      action: "PASSWORD_RESET",
      module: "AUTH",
      details: `Password reset successfully for ${user.email}`,
      timestamp: Date.now(),
    });

    return { success: true, message: "Password updated successfully." };
  },
});

// 5. Get Current Active Session User Query
export const getCurrentSessionUser = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken!))
      .first();

    if (!session || Date.now() > session.expiresAt) return null;

    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "active") return null;

    const role = await ctx.db.get(user.roleId);
    const rolePerms = role
      ? await ctx.db
          .query("role_permissions")
          .withIndex("by_roleId", (q) => q.eq("roleId", role._id))
          .collect()
      : [];

    const permissions = rolePerms.map((rp) => rp.permissionCode);

    return {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      employeeId: user.employeeId,
      roleId: user.roleId,
      roleName: role?.name || "Super Admin",
      companyId: user.companyId,
      permissions: permissions.length > 0 ? permissions : ["*"],
    };
  },
});

// 6. Logout Mutation
export const logoutSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});
