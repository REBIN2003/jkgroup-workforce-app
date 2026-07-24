import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Generate Storage Upload URL
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// 2. Upload Employee PDF Document
export const uploadEmployeePdfDocument = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    fileName: v.string(),
    storageId: v.id("_storage"),
    fileSize: v.number(),
    fileType: v.string(),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.fileType !== "application/pdf" && !args.fileName.toLowerCase().endsWith(".pdf")) {
      throw new Error("Only PDF files (application/pdf) are supported.");
    }

    // Resolve company ID from user
    const user = await ctx.db.get(args.userId);
    let companyId = user?.companyId;
    if (!companyId) {
      const companyDoc = await ctx.db.query("companies").first();
      companyId = companyDoc?._id;
    }

    if (!companyId) {
      const newCompanyId = await ctx.db.insert("companies", {
        name: "JK Group International",
        code: "JKG-001",
        status: "active",
        createdAt: Date.now(),
      });
      companyId = newCompanyId;
    }

    const docId = await ctx.db.insert("documents", {
      userId: args.userId,
      companyId,
      title: args.title.trim(),
      documentType: "other",
      storageId: args.storageId,
      fileSize: args.fileSize,
      fileType: "application/pdf",
      uploadedBy: args.uploadedBy,
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.uploadedBy,
      action: "EMPLOYEE_DOCUMENT_UPLOADED",
      module: "DOCUMENTS",
      details: `Uploaded PDF document '${args.title}' (${args.fileName})`,
      timestamp: Date.now(),
    });

    return docId;
  },
});

// 3. Replace Employee PDF Document File
export const replaceEmployeeDocument = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileSize: v.number(),
    fileType: v.string(),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document record not found.");

    if (args.fileType !== "application/pdf") {
      throw new Error("Only PDF files (application/pdf) are allowed.");
    }

    // Purge old storage file
    try {
      await ctx.storage.delete(doc.storageId);
    } catch (e) {}

    await ctx.db.patch(args.documentId, {
      title: args.title ? args.title.trim() : doc.title,
      storageId: args.storageId,
      fileSize: args.fileSize,
      fileType: "application/pdf",
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: "EMPLOYEE_DOCUMENT_REPLACED",
      module: "DOCUMENTS",
      details: `Replaced PDF file for document '${doc.title}'`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// 4. Delete Employee PDF Document
export const deleteEmployeeDocument = mutation({
  args: {
    documentId: v.id("documents"),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document record not found.");

    try {
      await ctx.storage.delete(doc.storageId);
    } catch (e) {}

    await ctx.db.delete(args.documentId);

    await ctx.db.insert("audit_logs", {
      actorId: args.actorId,
      action: "EMPLOYEE_DOCUMENT_DELETED",
      module: "DOCUMENTS",
      details: `Deleted PDF document '${doc.title}'`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// 5. List Employee PDF Documents Query
export const listEmployeeDocuments = query({
  args: {
    userId: v.id("users"),
    searchQuery: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("newest"), v.literal("oldest"))),
  },
  handler: async (ctx, args) => {
    let docs = await ctx.db
      .query("documents")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const q = args.searchQuery.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d as any).fileName?.toLowerCase().includes(q)
      );
    }

    if (args.sortOrder === "oldest") {
      docs.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      docs.sort((a, b) => b.createdAt - a.createdAt);
    }

    const result = [];
    for (const d of docs) {
      const u = await ctx.db.get(d.userId);
      const uploader = d.uploadedBy ? await ctx.db.get(d.uploadedBy) : null;
      const fileUrl = await ctx.storage.getUrl(d.storageId);

      result.push({
        ...d,
        userName: u?.fullName || "Employee",
        uploadedByName: uploader?.fullName || u?.fullName || "System",
        fileUrl: fileUrl || undefined,
      });
    }

    return result;
  },
});

// Standard General Document Functions
export const createDocument = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")),
    title: v.string(),
    documentType: v.string(),
    storageId: v.id("_storage"),
    fileSize: v.number(),
    fileType: v.string(),
    expiryDate: v.optional(v.string()),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    let targetCompanyId = args.companyId;
    if (!targetCompanyId) {
      const targetUser = await ctx.db.get(args.userId);
      targetCompanyId = targetUser?.companyId;
    }
    if (!targetCompanyId) {
      const companyDoc = await ctx.db.query("companies").first();
      targetCompanyId = companyDoc?._id;
    }
    if (!targetCompanyId) {
      targetCompanyId = await ctx.db.insert("companies", {
        name: "JK Group International",
        code: "JKG-001",
        status: "active",
        createdAt: Date.now(),
      });
    }

    const docId = await ctx.db.insert("documents", {
      userId: args.userId,
      companyId: targetCompanyId,
      title: args.title,
      documentType: args.documentType,
      storageId: args.storageId,
      fileSize: args.fileSize,
      fileType: args.fileType,
      expiryDate: args.expiryDate,
      uploadedBy: args.uploadedBy,
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      actorId: args.uploadedBy,
      action: "DOCUMENT_UPLOAD",
      module: "DOCUMENTS",
      details: `Uploaded document '${args.title}' (${args.documentType})`,
      timestamp: Date.now(),
    });

    return docId;
  },
});

export const replaceDocumentFile = mutation({
  args: {
    documentId: v.id("documents"),
    storageId: v.id("_storage"),
    fileSize: v.number(),
    fileType: v.string(),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");

    try {
      await ctx.storage.delete(doc.storageId);
    } catch (e) {}

    await ctx.db.patch(args.documentId, {
      storageId: args.storageId,
      fileSize: args.fileSize,
      fileType: args.fileType,
    });

    return { success: true };
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");

    try {
      await ctx.storage.delete(doc.storageId);
    } catch (e) {}

    await ctx.db.delete(args.documentId);
    return { success: true };
  },
});

export const listDocuments = query({
  args: {
    userId: v.optional(v.id("users")),
    loggedInUserId: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    roleName: v.optional(v.string()),
    documentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Backward compatibility: if loggedInUserId is missing, fall back to args.userId as active user
    const activeUserId = args.loggedInUserId || args.userId;
    if (!activeUserId) {
      return [];
    }

    const activeRole = args.roleName || "Employee";
    const activeCompanyId = args.companyId;

    let docs = [];

    // If a target userId is requested (e.g. viewing an employee's profile document vault)
    if (args.userId) {
      let isAuthorized = false;

      if (!args.loggedInUserId || args.loggedInUserId === args.userId) {
        // Self or loading state fallback
        isAuthorized = true;
      } else if (activeRole === "Super Admin" || activeRole === "HR Manager") {
        isAuthorized = true;
      } else if (activeRole === "General Manager") {
        const targetUser = await ctx.db.get(args.userId);
        if (targetUser && targetUser.companyId === activeCompanyId) {
          isAuthorized = true;
        }
      } else if (activeRole === "Project Manager") {
        // Project Manager checks
        const managedProjects = await ctx.db
          .query("projects")
          .withIndex("by_projectManagerId", (q) => q.eq("projectManagerId", activeUserId))
          .collect();
        const projectIds = managedProjects.map((p) => p._id);

        const assignedUserIds = new Set<string>();
        assignedUserIds.add(activeUserId);

        const attendanceLogs = await ctx.db.query("attendance").collect();
        for (const log of attendanceLogs) {
          if (log.projectId && projectIds.includes(log.projectId)) {
            assignedUserIds.add(log.userId);
          }
        }

        const timeRegs = await ctx.db.query("time_registrations").collect();
        for (const reg of timeRegs) {
          if (reg.projectId && projectIds.includes(reg.projectId)) {
            assignedUserIds.add(reg.userId);
          }
        }

        if (assignedUserIds.has(args.userId)) {
          isAuthorized = true;
        }
      } else {
        // Standard Employee / other role has no permission to view others' documents
        isAuthorized = false;
      }

      if (isAuthorized) {
        docs = await ctx.db
          .query("documents")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .collect();
      }
    } else {
      // General list documents (viewing documents tab)
      if (activeRole === "Super Admin" || activeRole === "HR Manager") {
        docs = await ctx.db.query("documents").collect();
      } else if (activeRole === "General Manager") {
        if (activeCompanyId) {
          docs = await ctx.db
            .query("documents")
            .withIndex("by_companyId", (q) => q.eq("companyId", activeCompanyId))
            .collect();
        }
      } else if (activeRole === "Project Manager") {
        const managedProjects = await ctx.db
          .query("projects")
          .withIndex("by_projectManagerId", (q) => q.eq("projectManagerId", activeUserId))
          .collect();
        const projectIds = managedProjects.map((p) => p._id);

        const assignedUserIds = new Set<string>();
        assignedUserIds.add(activeUserId);

        const attendanceLogs = await ctx.db.query("attendance").collect();
        for (const log of attendanceLogs) {
          if (log.projectId && projectIds.includes(log.projectId)) {
            assignedUserIds.add(log.userId);
          }
        }

        const timeRegs = await ctx.db.query("time_registrations").collect();
        for (const reg of timeRegs) {
          if (reg.projectId && projectIds.includes(reg.projectId)) {
            assignedUserIds.add(reg.userId);
          }
        }

        const allDocs = await ctx.db.query("documents").collect();
        docs = allDocs.filter((d) => assignedUserIds.has(d.userId));
      } else {
        docs = await ctx.db
          .query("documents")
          .withIndex("by_userId", (q) => q.eq("userId", activeUserId))
          .collect();
      }
    }

    if (args.documentType) {
      docs = docs.filter((d) => d.documentType === args.documentType);
    }

    const result = [];
    for (const d of docs) {
      const u = (await ctx.db.get(d.userId)) as any;
      const url = await ctx.storage.getUrl(d.storageId);
      result.push({
        ...d,
        userName: u?.fullName || "Unknown",
        employeeId: u?.employeeId || "N/A",
        fileUrl: url,
      });
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  },
});
