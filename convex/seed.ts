import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Standardized secure password hashing helper (SHA-256 in pure JS to support standard V8 sandbox)
export function hashPassword(password: string): string {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const bytes = [];
  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i);
    if (charCode < 128) {
      bytes.push(charCode);
    } else if (charCode < 2048) {
      bytes.push((charCode >> 6) | 192);
      bytes.push((charCode & 63) | 128);
    } else {
      bytes.push((charCode >> 12) | 224);
      bytes.push(((charCode >> 6) & 63) | 128);
      bytes.push((charCode & 63) | 128);
    }
  }

  const l = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) {
    bytes.push(0);
  }
  for (let i = 7; i >= 0; i--) {
    bytes.push((l >>> (i * 8)) & 0xff);
  }

  const words = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }

  for (let chunkIdx = 0; chunkIdx < words.length; chunkIdx += 16) {
    const w = words.slice(chunkIdx, chunkIdx + 16);
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w.push((w[i - 16] + s0 + w[i - 7] + s1) | 0);
    }

    const currentHash = [...hash];
    for (let i = 0; i < 64; i++) {
      const a = currentHash[0], b = currentHash[1], c = currentHash[2], d = currentHash[3];
      const e = currentHash[4], f = currentHash[5], g = currentHash[6], h = currentHash[7];

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[i] + w[i]) | 0;

      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      currentHash.pop();
      currentHash.unshift((temp1 + temp2) | 0);
      currentHash[4] = (currentHash[4] + temp1) | 0;
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + currentHash[i]) | 0;
    }
  }

  return hash.map(val => {
    const hex = (val >>> 0).toString(16);
    return hex.padStart(8, '0');
  }).join('');
}

// Legacy password hashing helper for backward compatibility validation
export function legacyHashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "hash_" + Math.abs(hash).toString(16) + "_" + password.length;
}

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Seed Permissions
    const initialPermissions = [
      { code: "*", module: "SYSTEM", description: "Full Master Access" },
      { code: "users:read", module: "USERS", description: "Read user directory" },
      { code: "users:create", module: "USERS", description: "Create new employee" },
      { code: "users:update", module: "USERS", description: "Update user profile" },
      { code: "users:delete", module: "USERS", description: "Delete user account" },
      { code: "roles:manage", module: "RBAC", description: "Manage RBAC roles" },
      { code: "projects:read", module: "PROJECTS", description: "View projects" },
      { code: "projects:create", module: "PROJECTS", description: "Create project" },
      { code: "projects:manage", module: "PROJECTS", description: "Manage projects" },
      { code: "attendance:view_own", module: "ATTENDANCE", description: "View own attendance" },
      { code: "attendance:view_all", module: "ATTENDANCE", description: "View workforce attendance" },
      { code: "attendance:clock", module: "ATTENDANCE", description: "Clock in and out" },
      { code: "leave:view_own", module: "LEAVE", description: "View own leaves" },
      { code: "leave:apply", module: "LEAVE", description: "Submit leave request" },
      { code: "leave:approve", module: "LEAVE", description: "Approve leave applications" },
      { code: "documents:view_own", module: "DOCUMENTS", description: "View own document vault" },
      { code: "documents:view_all", module: "DOCUMENTS", description: "View all corporate documents" },
      { code: "documents:upload", module: "DOCUMENTS", description: "Upload document file" },
      { code: "documents:sign", module: "DOCUMENTS", description: "Digitally sign documents" },
      { code: "companies:view", module: "COMPANIES", description: "View companies and branches" },
      { code: "companies:manage", module: "COMPANIES", description: "Manage company details" },
      { code: "audit:view", module: "SECURITY", description: "View security audit logs" },
      { code: "settings:view", module: "SETTINGS", description: "View system settings" },
      { code: "settings:manage", module: "SETTINGS", description: "Manage global settings" },
    ];

    for (const p of initialPermissions) {
      const existing = await ctx.db
        .query("permissions")
        .withIndex("by_code", (q) => q.eq("code", p.code))
        .first();

      if (!existing) {
        await ctx.db.insert("permissions", p);
      }
    }

    // 2. Seed Roles
    const initialRoles = [
      { name: "Super Admin", description: "System Super Administrator", isSystem: true },
      { name: "General Manager", description: "Executive Corporate General Manager", isSystem: true },
      { name: "Project Manager", description: "Operational Site Project Manager", isSystem: true },
      { name: "Employee", description: "Standard Enterprise Employee", isSystem: true },
    ];

    const roleMap: Record<string, any> = {};

    for (const r of initialRoles) {
      let roleDoc = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", r.name))
        .first();

      if (!roleDoc) {
        const roleId = await ctx.db.insert("roles", {
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          createdAt: Date.now(),
        });
        roleDoc = await ctx.db.get(roleId);
      }
      if (roleDoc) {
        roleMap[r.name] = roleDoc._id;
      }
    }

    // 3. Link Roles to Permissions
    const defaultRolePerms: Record<string, string[]> = {
      "Super Admin": initialPermissions.map((p) => p.code),
      "General Manager": [
        "settings:view",
        "users:create",
        "users:read",
        "users:update",
        "companies:manage",
        "companies:view",
        "projects:create",
        "projects:read",
        "projects:update",
        "attendance:clock",
        "attendance:view_own",
        "attendance:view_all",
        "attendance:manage",
        "leave:apply",
        "leave:view_own",
        "leave:view_all",
        "leave:approve",
        "documents:upload",
        "documents:view_own",
        "documents:view_all",
        "documents:sign",
        "audit:view",
      ],
      "Project Manager": [
        "users:read",
        "companies:view",
        "projects:read",
        "projects:update",
        "attendance:clock",
        "attendance:view_own",
        "attendance:view_all",
        "leave:apply",
        "leave:view_own",
        "leave:approve",
        "documents:upload",
        "documents:view_own",
        "documents:view_all",
        "documents:sign",
      ],
      "Employee": [
        "attendance:clock",
        "attendance:view_own",
        "leave:apply",
        "leave:view_own",
        "documents:view_own",
        "documents:sign",
      ],
    };

    for (const [roleName, perms] of Object.entries(defaultRolePerms)) {
      const roleId = roleMap[roleName];
      if (roleId) {
        for (const permCode of perms) {
          const existingLink = await ctx.db
            .query("role_permissions")
            .withIndex("by_role_perm", (q) =>
              q.eq("roleId", roleId).eq("permissionCode", permCode)
            )
            .first();

          if (!existingLink) {
            await ctx.db.insert("role_permissions", {
              roleId,
              permissionCode: permCode,
            });
          }
        }
      }
    }

    // 4. Seed Default Company
    let companyDoc = await ctx.db
      .query("companies")
      .withIndex("by_code", (q) => q.eq("code", "JKG-001"))
      .first();

    if (!companyDoc) {
      const companyId = await ctx.db.insert("companies", {
        name: "JK Group International",
        code: "JKG-001",
        taxId: "TAX-998877",
        address: "Corporate HQ, Dubai International Financial Centre",
        email: "contact@jkgroup.com",
        phone: "+971 4 123 4567",
        status: "active",
        createdAt: Date.now(),
      });
      companyDoc = await ctx.db.get(companyId);
    }

    // 5. Seed Default Super Admin Account
    const superAdminRoleId = roleMap["Super Admin"];
    const targetEmail = "admin@company.com";
    const computedPasswordHash = hashPassword("Admin@123456");

    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", targetEmail))
      .first();

    let adminUserId = existingAdmin?._id;

    if (!existingAdmin && superAdminRoleId && companyDoc) {
      adminUserId = await ctx.db.insert("users", {
        email: targetEmail,
        passwordHash: computedPasswordHash,
        fullName: "Super Administrator",
        roleId: superAdminRoleId,
        companyId: companyDoc._id,
        employeeId: "EMP-001",
        phone: "+971 50 000 0000",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("audit_logs", {
        actorId: adminUserId,
        action: "DATABASE_SEED",
        module: "SYSTEM",
        details: `Seeded default Super Admin account (${targetEmail})`,
        timestamp: Date.now(),
      });
    } else if (existingAdmin && existingAdmin.passwordHash !== computedPasswordHash) {
      // Auto-update existing admin account password hash to standard hash
      await ctx.db.patch(existingAdmin._id, {
        passwordHash: computedPasswordHash,
        status: "active",
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      message: "Database seeded successfully with default Super Admin account (admin@company.com / Admin@123456).",
      superAdminEmail: targetEmail,
    };
  },
});
