import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Users Collection
  users: defineTable({
    email: v.string(),
    passwordHash: v.optional(v.string()),
    fullName: v.string(),
    roleId: v.id("roles"),
    companyId: v.optional(v.id("companies")),
    employeeId: v.string(),
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
        taxId: v.optional(v.string()),
        taxCategory: v.optional(v.string()),
      })
    ),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    otpCode: v.optional(v.string()),
    otpExpiresAt: v.optional(v.number()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    country: v.optional(v.string()),
    approvalStatus: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    registrationDate: v.optional(v.number()),
    emailVerified: v.optional(v.boolean()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    rejectedReason: v.optional(v.string()),
    requestedRoleName: v.optional(v.string()),
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
    dateOfBirth: v.optional(v.string()),
    placeOfBirth: v.optional(v.string()),
    accommodationAddress: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_employeeId", ["employeeId"])
    .index("by_companyId", ["companyId"])
    .index("by_roleId", ["roleId"])
    .index("by_approvalStatus", ["approvalStatus"]),

  // 2. Roles Collection
  roles: defineTable({
    name: v.string(),
    description: v.string(),
    isSystem: v.boolean(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  // 3. Permissions Collection
  permissions: defineTable({
    code: v.string(),
    module: v.string(),
    description: v.string(),
  }).index("by_code", ["code"]),

  // 4. Role Permissions Join Collection
  role_permissions: defineTable({
    roleId: v.id("roles"),
    permissionCode: v.string(),
  })
    .index("by_roleId", ["roleId"])
    .index("by_role_perm", ["roleId", "permissionCode"]),

  // 5. Companies Collection
  companies: defineTable({
    name: v.string(),
    code: v.string(),
    taxId: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // 6. Projects Collection
  projects: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_projectManagerId", ["projectManagerId"]),

  // 7. Attendance Collection
  attendance: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    companyId: v.id("companies"),
    date: v.string(),
    clockInTime: v.number(),
    breakStartTime: v.optional(v.number()),
    breakEndTime: v.optional(v.number()),
    totalBreakMinutes: v.optional(v.number()),
    clockOutTime: v.optional(v.number()),
    clockInPhotoId: v.optional(v.id("_storage")),
    clockOutPhotoId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("half_day"),
      v.literal("on_break")
    ),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_company_date", ["companyId", "date"])
    .index("by_project_date", ["projectId", "date"]),

  // 8. Work Photos Collection
  work_photos: defineTable({
    attendanceId: v.optional(v.id("attendance")),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    storageId: v.id("_storage"),
    photoType: v.union(v.literal("clock_in"), v.literal("clock_out"), v.literal("site_work")),
    notes: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_attendanceId", ["attendanceId"]),

  // 9. Time Registrations Collection
  time_registrations: defineTable({
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
    totalHours: v.number(),
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
    submittedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_user_year_week", ["userId", "year", "weekNumber"])
    .index("by_company", ["companyId"])
    .index("by_project", ["projectId"]),

  // 10. Leave Requests Collection
  leave_requests: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),
    leaveType: v.union(
      v.literal("annual"),
      v.literal("sick"),
      v.literal("casual"),
      v.literal("unpaid")
    ),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.string(),
    attachmentStorageId: v.optional(v.id("_storage")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    approvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_companyId", ["companyId"])
    .index("by_status", ["status"]),

  // 11. Approval Logs Collection
  approval_logs: defineTable({
    entityType: v.union(
      v.literal("leave"),
      v.literal("document"),
      v.literal("project"),
      v.literal("timesheet"),
      v.literal("attendance"),
      v.literal("photo")
    ),
    entityId: v.string(),
    actorId: v.id("users"),
    action: v.union(v.literal("submit"), v.literal("approve"), v.literal("reject")),
    comment: v.optional(v.string()),
    signatureStorageId: v.optional(v.id("_storage")),
    ipAddress: v.optional(v.string()),
    locked: v.optional(v.boolean()),
    timestamp: v.number(),
  }).index("by_entity", ["entityType", "entityId"]),

  // 12. Documents Collection
  documents: defineTable({
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")),
    title: v.string(),
    documentType: v.string(),
    storageId: v.id("_storage"),
    fileSize: v.optional(v.number()),
    fileType: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    uploadedBy: v.optional(v.id("users")),
    originalFilename: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    storageUrl: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_companyId", ["companyId"]),

  // 13. Signatures Collection
  signatures: defineTable({
    documentId: v.optional(v.id("documents")),
    userId: v.id("users"),
    signatureStorageId: v.id("_storage"),
    signedAt: v.number(),
    ipAddress: v.optional(v.string()),
  }),

  // 14. Notifications Collection
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("warning"), v.literal("approval")),
    isRead: v.boolean(),
    link: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId_read", ["userId", "isRead"]),

  // 15. Sessions Collection
  sessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["sessionToken"])
    .index("by_userId", ["userId"]),

  // 16. Statutory Holidays Collection
  holidays: defineTable({
    name: v.string(),
    date: v.string(),
    isMandatory: v.boolean(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_date", ["date"]),

  // 17. Audit Logs Collection
  audit_logs: defineTable({
    actorId: v.optional(v.id("users")),
    action: v.string(),
    module: v.string(),
    details: v.string(),
    ipAddress: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_actorId", ["actorId"])
    .index("by_module", ["module"]),

  // 18. Settings Collection
  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
