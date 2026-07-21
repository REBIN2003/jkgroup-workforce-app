import { NavigationItem, RoleName } from "../types";

export const ROLES = {
  SUPER_ADMIN: "Super Admin" as RoleName,
  GENERAL_MANAGER: "General Manager" as RoleName,
  PROJECT_MANAGER: "Project Manager" as RoleName,
  EMPLOYEE: "Employee" as RoleName,
};

export const PERMISSIONS = {
  // System & Settings
  SETTINGS_MANAGE: "settings:manage",
  SETTINGS_VIEW: "settings:view",

  // Users & Roles
  USERS_CREATE: "users:create",
  USERS_READ: "users:read",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  ROLES_MANAGE: "roles:manage",

  // Companies
  COMPANIES_MANAGE: "companies:manage",
  COMPANIES_VIEW: "companies:view",

  // Projects
  PROJECTS_CREATE: "projects:create",
  PROJECTS_READ: "projects:read",
  PROJECTS_UPDATE: "projects:update",
  PROJECTS_DELETE: "projects:delete",

  // Attendance
  ATTENDANCE_CLOCK: "attendance:clock",
  ATTENDANCE_VIEW_OWN: "attendance:view_own",
  ATTENDANCE_VIEW_ALL: "attendance:view_all",
  ATTENDANCE_MANAGE: "attendance:manage",

  // Leave Requests
  LEAVE_APPLY: "leave:apply",
  LEAVE_VIEW_OWN: "leave:view_own",
  LEAVE_VIEW_ALL: "leave:view_all",
  LEAVE_APPROVE: "leave:approve",

  // Documents
  DOCUMENTS_UPLOAD: "documents:upload",
  DOCUMENTS_VIEW_OWN: "documents:view_own",
  DOCUMENTS_VIEW_ALL: "documents:view_all",
  DOCUMENTS_SIGN: "documents:sign",

  // Audit Logs
  AUDIT_VIEW: "audit:view",
} as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  "Super Admin": Object.values(PERMISSIONS),
  "General Manager": [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.COMPANIES_MANAGE,
    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.ATTENDANCE_CLOCK,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.LEAVE_VIEW_OWN,
    PERMISSIONS.LEAVE_VIEW_ALL,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_VIEW_OWN,
    PERMISSIONS.DOCUMENTS_VIEW_ALL,
    PERMISSIONS.DOCUMENTS_SIGN,
    PERMISSIONS.AUDIT_VIEW,
  ],
  "Project Manager": [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.ATTENDANCE_CLOCK,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.LEAVE_VIEW_OWN,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_VIEW_OWN,
    PERMISSIONS.DOCUMENTS_VIEW_ALL,
    PERMISSIONS.DOCUMENTS_SIGN,
  ],
  "Employee": [
    PERMISSIONS.ATTENDANCE_CLOCK,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.LEAVE_VIEW_OWN,
    PERMISSIONS.DOCUMENTS_VIEW_OWN,
    PERMISSIONS.DOCUMENTS_SIGN,
  ],
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "Main Dashboard",
    href: "/dashboard",
    icon: "bi-speedometer2",
  },
  {
    label: "Pending Registrations",
    href: "/super-admin/registrations",
    icon: "bi-person-check",
    permission: PERMISSIONS.USERS_READ,
  },
  {
    label: "Manager Approvals Hub",
    href: "/manager-approvals",
    icon: "bi-check-all",
    permission: PERMISSIONS.LEAVE_APPROVE,
  },
  {
    label: "RBAC Permission Matrix",
    href: "/super-admin/roles",
    icon: "bi-shield-lock",
    permission: PERMISSIONS.ROLES_MANAGE,
  },
  {
    label: "Statutory Holidays",
    href: "/super-admin/holidays",
    icon: "bi-calendar-event",
    permission: PERMISSIONS.SETTINGS_MANAGE,
  },
  {
    label: "Active User Sessions",
    href: "/super-admin/sessions",
    icon: "bi-laptop",
    permission: PERMISSIONS.AUDIT_VIEW,
  },
  {
    label: "Enterprise Reports",
    href: "/reports",
    icon: "bi-file-earmark-bar-graph",
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
  {
    label: "My Employee Profile",
    href: "/profile",
    icon: "bi-person-badge",
  },
  {
    label: "Time Registration",
    href: "/time-registration",
    icon: "bi-calendar-range",
    permission: PERMISSIONS.ATTENDANCE_VIEW_OWN,
  },
  {
    label: "Attendance & Work Log",
    href: "/attendance",
    icon: "bi-clock-history",
    permission: PERMISSIONS.ATTENDANCE_VIEW_OWN,
  },
  {
    label: "Leave Applications",
    href: "/leave-requests",
    icon: "bi-calendar-check",
    permission: PERMISSIONS.LEAVE_VIEW_OWN,
  },
  {
    label: "My Assigned Projects",
    href: "/my-projects",
    icon: "bi-briefcase",
    permission: PERMISSIONS.PROJECTS_READ,
  },
  {
    label: "Projects Directory",
    href: "/projects",
    icon: "bi-diagram-3",
    permission: PERMISSIONS.PROJECTS_READ,
  },
  {
    label: "Document Vault",
    href: "/documents",
    icon: "bi-file-earmark-text",
    permission: PERMISSIONS.DOCUMENTS_VIEW_OWN,
  },
  {
    label: "Employee Directory",
    href: "/users",
    icon: "bi-people",
    permission: PERMISSIONS.USERS_READ,
  },
  {
    label: "Companies & Branches",
    href: "/companies",
    icon: "bi-building",
    permission: PERMISSIONS.COMPANIES_VIEW,
  },
  {
    label: "Security Audit Logs",
    href: "/audit-logs",
    icon: "bi-shield-check",
    permission: PERMISSIONS.AUDIT_VIEW,
  },
  {
    label: "System Settings",
    href: "/settings",
    icon: "bi-gear",
    permission: PERMISSIONS.SETTINGS_MANAGE,
  },
];
