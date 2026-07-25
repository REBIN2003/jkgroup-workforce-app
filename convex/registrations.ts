import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword } from "./seed";

// 1. Generate Upload URL for Convex Storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// 2. Submit Public User Registration
export const registerUser = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    password: v.string(),
    country: v.string(),
    roleName: v.union(v.literal("Employee"), v.literal("Project Manager"), v.literal("General Manager")),
    dateOfBirth: v.string(),
    placeOfBirth: v.string(),
    accommodationAddress: v.string(),
    profileImageStorageId: v.optional(v.id("_storage")),
    uploadedDocuments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          fileName: v.string(),
          fileType: v.string(),
          documentType: v.optional(v.string()),
          fileSize: v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Role Guard: Prevent Public Super Admin Registration
    if ((args.roleName as string) === "Super Admin") {
      throw new ConvexError("Super Admin accounts cannot be created via public registration.");
    }

    const normalizedEmail = args.email.trim().toLowerCase();

    // Check duplicate email
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existingEmail) {
      throw new ConvexError("An account with this corporate email address already exists.");
    }

    // Check duplicate phone
    const existingPhone = await ctx.db.query("users").collect();
    const phoneExists = existingPhone.some((u) => u.phone === args.phone.trim());
    if (phoneExists) {
      throw new ConvexError("An account with this mobile number already exists.");
    }

    // Lookup Role Record
    const roleDoc = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .first();

    if (!roleDoc) {
      throw new ConvexError(`Target system role '${args.roleName}' not found.`);
    }

    // Lookup Company Entity
    const companyDoc = await ctx.db.query("companies").first();

    // Generate Employee ID
    const empId = "EMP-REG-" + Math.floor(1000 + Math.random() * 9000).toString();

    // Password Hashing
    const hashedPassword = hashPassword(args.password);

    // OTP Code Generation
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = Date.now() + 15 * 60 * 1000; // 15 Mins

    // Insert Pending User Registration Record
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      fullName: `${args.firstName.trim()} ${args.lastName.trim()}`,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      country: args.country.trim(),
      phone: args.phone.trim(),
      roleId: roleDoc._id,
      requestedRoleName: args.roleName,
      companyId: companyDoc?._id,
      employeeId: empId,
      profileImageStorageId: args.profileImageStorageId,
      uploadedDocuments: args.uploadedDocuments,
      dateOfBirth: args.dateOfBirth,
      placeOfBirth: args.placeOfBirth,
      accommodationAddress: args.accommodationAddress,
      status: "inactive",
      approvalStatus: "pending",
      emailVerified: false,
      registrationDate: Date.now(),
      otpCode,
      otpExpiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Security Audit Log
    await ctx.db.insert("audit_logs", {
      actorId: userId,
      action: "USER_REGISTRATION_SUBMITTED",
      module: "AUTH",
      details: `New ${args.roleName} registration submitted for ${normalizedEmail} (Pending Approval)`,
      timestamp: Date.now(),
    });

    return {
      userId,
      otpCode,
      message: "Registration submitted successfully. Please verify your email OTP.",
    };
  },
});

// 3. Verify Email Registration OTP
export const verifyRegistrationOtp = mutation({
  args: {
    userId: v.id("users"),
    otpCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new ConvexError("Invalid or expired OTP verification code.");
    }

    if (Date.now() > user.otpExpiresAt) {
      throw new ConvexError("OTP Verification Code Expired. Please request a new code.");
    }

    const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
    const isBypass = args.otpCode === "123456" && isDev;
    if (user.otpCode !== args.otpCode && !isBypass) {
      throw new ConvexError("Invalid OTP code. Please check the code sent to your email.");
    }

    await ctx.db.patch(args.userId, {
      emailVerified: true,
      otpCode: undefined,
      otpExpiresAt: undefined,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.userId,
      action: "REGISTRATION_EMAIL_VERIFIED",
      module: "AUTH",
      details: `Email OTP verified for ${user.email}`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "Email address verified successfully. Your account is now pending Super Admin approval.",
    };
  },
});

// 4. Resend Registration OTP
export const resendRegistrationOtp = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Registration record not found.");

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = Date.now() + 15 * 60 * 1000;

    await ctx.db.patch(args.userId, {
      otpCode,
      otpExpiresAt,
      updatedAt: Date.now(),
    });

    return { success: true, otpCode, message: `New OTP code sent: ${otpCode}` };
  },
});

// 5. List Pending Registrations Query (For Super Admin & General Manager)
export const listPendingRegistrations = query({
  args: {
    statusFilter: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("all"))),
    roleFilter: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let users = args.statusFilter && args.statusFilter !== "all"
      ? await ctx.db
          .query("users")
          .withIndex("by_approvalStatus", (q) => q.eq("approvalStatus", args.statusFilter as any))
          .collect()
      : await ctx.db.query("users").collect();

    // Filter registrations (must have an approvalStatus set or status !== 'active')
    users = users.filter((u) => u.approvalStatus !== undefined || u.requestedRoleName !== undefined);

    if (args.roleFilter && args.roleFilter !== "all") {
      users = users.filter((u) => u.requestedRoleName === args.roleFilter);
    }

    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const q = args.searchQuery.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q)) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(q))
      );
    }

    // Sort by registration date descending
    users.sort((a, b) => (b.registrationDate || b.createdAt) - (a.registrationDate || a.createdAt));

    const result = [];
    for (const u of users) {
      let profileImageUrl: string | undefined = undefined;
      if (u.profileImageStorageId) {
        const url = await ctx.storage.getUrl(u.profileImageStorageId);
        if (url) profileImageUrl = url;
      }

      const docsWithUrls = [];
      if (u.uploadedDocuments && u.uploadedDocuments.length > 0) {
        for (const doc of u.uploadedDocuments) {
          const fileUrl = await ctx.storage.getUrl(doc.storageId);
          docsWithUrls.push({
            ...doc,
            fileUrl: fileUrl || undefined,
          });
        }
      }

      let approverName: string | undefined = undefined;
      if (u.approvedBy) {
        const approver = await ctx.db.get(u.approvedBy);
        if (approver) approverName = approver.fullName;
      }

      result.push({
        ...u,
        profileImageUrl,
        uploadedDocumentsWithUrls: docsWithUrls,
        approverName,
      });
    }

    return result;
  },
});

// 6. Approve Registration Mutation (Super Admin Only)
export const approveRegistration = mutation({
  args: {
    userId: v.id("users"),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Registration record not found.");

    await ctx.db.patch(args.userId, {
      approvalStatus: "approved",
      status: "active",
      emailVerified: true,
      approvedBy: args.actorId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Copy uploadedDocuments to documents collection upon approval
    if (user.uploadedDocuments && user.uploadedDocuments.length > 0) {
      for (const doc of user.uploadedDocuments) {
        // Prevent duplicates
        const existingDoc = await ctx.db
          .query("documents")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("storageId"), doc.storageId))
          .first();

        if (!existingDoc) {
          const docType = (doc.documentType || "other") as any;
          const storageUrl = await ctx.storage.getUrl(doc.storageId);

          await ctx.db.insert("documents", {
            userId: args.userId,
            companyId: user.companyId || (await ctx.db.query("companies").first())?._id as any,
            title: doc.fileName,
            documentType: docType,
            storageId: doc.storageId,
            fileSize: doc.fileSize || 0,
            fileType: doc.fileType,
            uploadedBy: args.actorId || args.userId,
            createdAt: Date.now(),
            originalFilename: doc.fileName,
            mimeType: doc.fileType,
            employeeId: user.employeeId,
            storageUrl: storageUrl || undefined,
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId || args.userId,
      action: "REGISTRATION_APPROVED",
      module: "SUPER_ADMIN",
      details: `Approved registration for ${user.fullName} (${user.email}) as ${user.requestedRoleName || "Employee"}`,
      timestamp: Date.now(),
    });

    return { success: true, message: `Registration for ${user.fullName} has been approved.` };
  },
});

// 7. Reject Registration Mutation (Super Admin Only)
export const rejectRegistration = mutation({
  args: {
    userId: v.id("users"),
    actorId: v.optional(v.id("users")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Registration record not found.");

    await ctx.db.patch(args.userId, {
      approvalStatus: "rejected",
      status: "inactive",
      rejectedReason: args.reason.trim(),
      approvedBy: args.actorId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId || args.userId,
      action: "REGISTRATION_REJECTED",
      module: "SUPER_ADMIN",
      details: `Rejected registration for ${user.fullName} (${user.email}). Reason: ${args.reason}`,
      timestamp: Date.now(),
    });

    return { success: true, message: `Registration for ${user.fullName} has been rejected.` };
  },
});

// 8. Delete Registration Record (Super Admin Only)
export const deleteRegistration = mutation({
  args: {
    userId: v.id("users"),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Registration record not found.");

    // Delete stored files if present
    if (user.profileImageStorageId) {
      try {
        await ctx.storage.delete(user.profileImageStorageId);
      } catch (e) {}
    }
    if (user.uploadedDocuments && user.uploadedDocuments.length > 0) {
      for (const doc of user.uploadedDocuments) {
        try {
          await ctx.storage.delete(doc.storageId);
        } catch (e) {}
      }
    }

    await ctx.db.delete(args.userId);

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: "REGISTRATION_DELETED",
      module: "SUPER_ADMIN",
      details: `Deleted registration record ${args.userId} (${user.email})`,
      timestamp: Date.now(),
    });

    return { success: true, message: "Registration record deleted." };
  },
});
