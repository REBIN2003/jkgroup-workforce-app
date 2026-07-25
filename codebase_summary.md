# JK Group Workforce Management App — Codebase Analysis & Summary

This document provides a detailed, technical overview of the workforce management application, its codebase layout, database schema, API flow architecture, component logic, current linter issues/bugs, and the registration flow.

---

## 1. Technology Stack & Architecture

The application is built as an enterprise-grade Single Page Application (SPA) utilizing a modern Next.js + React frontend and a serverless Convex backend.

* **Frontend Framework**: Next.js 16.2.10 (App Router) with React 19.2.4.
* **Backend Database & Serverless Functions**: Convex 1.42.3 (providing transactional document storage, real-time reactive queries, mutations, and built-in file storage).
* **Styling & Icons**: Bootstrap 5.3.8, Bootstrap Icons 1.13.1, and TailwindCSS 4.
* **Form Management & Validation**: React Hook Form 7.82.0 with Zod 4.4.3 schemas.
* **PDF Document Generation**: `@react-pdf/renderer` 4.5.1 for rendering employment contracts.

---

## 2. Database Schema (`convex/schema.ts`)

Convex defines the database collections strictly using a schema file. There are **18 distinct tables**:

| # | Table Name | Key Fields & Types | Indexes | Purpose |
|---|------------|--------------------|---------|---------|
| **1** | `users` | `email` (string), `passwordHash` (string), `fullName` (string), `roleId` (id), `companyId` (id), `employeeId` (string), `status` (active/inactive/suspended), `approvalStatus` (pending/approved/rejected), `otpCode`, `otpExpiresAt`, documents, profile photo, bio data | `by_email`, `by_employeeId`, `by_companyId`, `by_roleId`, `by_approvalStatus` | Main user and employee directory. Handles registration details, verification documents, and active profile status. |
| **2** | `roles` | `name` (string), `description` (string), `isSystem` (boolean) | `by_name` | User access levels (e.g., Super Admin, General Manager, Project Manager, Employee). |
| **3** | `permissions` | `code` (string), `module` (string), `description` (string) | `by_code` | System capability tags. |
| **4** | `role_permissions` | `roleId` (id), `permissionCode` (string) | `by_roleId`, `by_role_perm` | Join table mapping roles to their allowed permissions. |
| **5** | `companies` | `name` (string), `code` (string), `status` (active/inactive) | `by_code` | Company profiles and branches. |
| **6** | `projects` | `companyId` (id), `name` (string), `code` (string), `projectManagerId` (id), `status` | `by_companyId`, `by_projectManagerId` | Project tracking for site workers. |
| **7** | `attendance` | `userId` (id), `projectId` (id), `companyId` (id), `date` (string), `clockInTime`, `clockOutTime`, break logs, photos, status (present/absent/late/half_day/on_break) | `by_user_date`, `by_company_date`, `by_project_date` | Daily attendance log with clock-in/out photo tracking. |
| **8** | `work_photos` | `attendanceId` (id), `userId` (id), `projectId` (id), `storageId` (id), `photoType` (clock_in/clock_out/site_work), `timestamp` | `by_userId`, `by_attendanceId` | Image uploads tied to shifts. |
| **9** | `time_registrations` | `userId` (id), `companyId` (id), `projectId` (id), `year` (number), `weekNumber` (number), `dailyHours` (object), `totalHours` (number), `status` (draft/submitted/approved/rejected) | `by_user_year_week`, `by_company`, `by_project` | Weekly timesheet records submittable for manager approval. |
| **10** | `leave_requests` | `userId` (id), `companyId` (id), `leaveType` (annual/sick/casual/unpaid), dates, `status` | `by_userId`, `by_companyId`, `by_status` | Holiday and sickness absence request tracker. |
| **11** | `approval_logs` | `entityType` (leave/document/project/timesheet/attendance/photo), `entityId` (string), `actorId` (id), `action` (submit/approve/reject) | `by_entity` | Unified trail of manager signatures and decisions. |
| **12** | `documents` | `userId` (id), `companyId` (id), `title` (string), `documentType` (string), `storageId` (id), `expiryDate` (string), URLs | `by_userId`, `by_companyId` | Repository of uploaded contracts, credentials, and verification copies. |
| **13** | `signatures` | `documentId` (id), `userId` (id), `signatureStorageId` (id), `signedAt` | - | Verification logs of workers signing documents. |
| **14** | `notifications` | `userId` (id), `title` (string), `message` (string), `type` (info/warning/approval), `isRead` (boolean) | `by_userId_read` | In-app alerts for users. |
| **15** | `sessions` | `userId` (id), `sessionToken` (string), `expiresAt` (number) | `by_token`, `by_userId` | Lightweight database-session storage mapping tokens to users. |
| **16** | `holidays` | `name` (string), `date` (string), `isMandatory` (boolean) | `by_date` | Statutory calendar holiday listing. |
| **17** | `audit_logs` | `actorId` (id), `action` (string), `module` (string), `details` (string), timestamp | `by_actorId`, `by_module` | Immutable ledger recording security activities (logins, uploads, RBAC updates). |
| **18** | `settings` | `key` (string), `value` (string) | `by_key` | Global system settings (e.g. system name). |

---

## 3. Client-Backend API Connections

The application does not use conventional REST API routes for database actions. Instead, it runs on Convex's real-time WebSocket protocol:

1. **Reactive Queries (`useQuery`)**:
   * Frontend components bind to a query endpoint (e.g., `useQuery(api.documents.listDocuments)`).
   * Any change in the underlying data automatically triggers a silent recalculation on the server and pushes a state update to the React client.
2. **Mutations (`useMutation`)**:
   * Writes, updates, and deletes are executed by invoking serverless mutation functions (e.g., `api.auth.loginWithPassword`).
   * Transactions are database-enforced, meaning each mutation runs atomically.
3. **Convex Storage Flow**:
   * The client calls a mutation to generate a temporary write URL (e.g., `api.registrations.generateUploadUrl`).
   * The client performs a native HTTP POST directly to the generated URL with the binary payload.
   * The return response includes a `storageId` reference.
   * The client subsequently passes this `storageId` to database mutations (such as `registerUser` or `createDocument`) to save a record of the file.

---

## 4. Feature and Directory Breakdown

* **Authentication (`(auth)`)**:
  * `login`: Supports password and OTP login options.
  * `register`: Public registration portal enabling file uploads for verification documents.
  * `forgot-password` / `reset-password`: Account recovery via email OTP.
* **Dashboard (`(dashboard)`)**:
  * `dashboard`: Aggregated dashboard displaying pending actions, announcements, and quick statistics.
  * `attendance`: Clock-in/Clock-out page. Leverages site camera/uploads for photo verification and allows recording breaks.
  * `time-registration`: Timesheet tracking where employees record daily hours worked per project.
  * `leave-requests`: Request forms and logs for annual and sick leave.
  * `documents`: File vault allowing workers to view and upload personal/corporate files and download dynamic PDF contracts.
  * `manager-approvals`: View and approve leave applications, timesheets, and attendance logs.
  * `super-admin`: Admin portal for approving new public registrations, checking audit logs, managing settings, and viewing database summaries.
  * `users` / `projects` / `companies`: Management directories for system structures.
  * `profile`: Profile page to update address, bank, and tax details.

---

## 5. Summary of Current Compilation/Linter Errors & Warnings

Running a lint analysis reveals **36 problems (19 errors, 17 warnings)**. The most severe issues that risk causing run-time failures or build crashes include:

### ⚠️ Impure Functions in Render (React 19 Rules Violation)
* **`src/features/projects/ProjectModal.tsx:31`**:
  ```typescript
  code: `PRJ-${Math.floor(100 + Math.random() * 900)}`
  ```
  *Calling `Math.random()` directly in component rendering violates pure function rules and causes unpredictable data updates during component re-renders.*
* **`app/(dashboard)/super-admin/registrations/page.tsx:349` and `:491`**:
  ```typescript
  new Date(item.registrationDate || item.createdAt || Date.now())
  ```
  *Calling `Date.now()` during rendering causes hydration issues and violates purity rules.*

### 🛑 Accessing Variables Before Declaration (TDZ Errors)
* **`src/features/camera/CameraCaptureModal.tsx`**:
  * `startCamera()` is called on line 38, but the `const startCamera = async () => ...` function is defined on line 47.
  * `stopCamera()` is called on line 40, but the function is defined on line 63.
  * *This can crash the modal when opening or closing because the variables are in the Temporal Dead Zone (TDZ).*

### ⚠️ Synchronous State Updates inside `useEffect` (Cascading Renders)
React 19 warns against calling state-setters synchronously in `useEffect` setups:
* **`src/hooks/useAuth.ts:27`**: `setSessionToken(token)` called synchronously inside `useEffect` on initial token fetch.
* **`src/components/layout/TopNavbar.tsx:14`**: Setting current date synchronously on mount.
* **`app/(dashboard)/attendance/page.tsx:15`**: Synchronous state set for mounted date.
* **`app/(dashboard)/layout.tsx:15`**: Closing sidebar state modification during render effect on route changes.
* **`app/(dashboard)/settings/page.tsx:36`**: Conditionally setting the system name dynamically on mount.

### 📝 Minor Warnings
* **Unescaped Quotes**: Many files (`app/(dashboard)/attendance/page.tsx`, `companies/page.tsx`, `projects/page.tsx`, `settings/page.tsx`) contain unescaped quotes (`'` and `"`) within elements, which should be replaced with HTML entities (like `&apos;` and `&quot;`).
* **Optimizations**: `<img>` elements used in place of NextJS `<Image>` tags.

---

## 6. Public User Registration Flow Analysis

Understanding the registration pipeline is critical to debugging the registration issue.

### The Backend Registration API (`convex/registrations.ts`)
1. **Inputs Checked**:
   * Checks for duplicate corporate email via database index queries.
   * Checks for duplicate phone numbers by collecting all user records and comparing.
   * Looks up the corresponding database ID for the system role name requested ("Employee", "Project Manager", "General Manager").
   * Retrieves the default company object in the database.
2. **Generates Employee Metadata**:
   * Generates a random alphanumeric Employee ID (`EMP-REG-XXXX`).
   * Generates a 6-digit OTP code (`otpCode`) and calculates its expiration (15 minutes from creation).
   * Hashes the password using pure JS SHA-256 (`hashPassword`).
3. **Database Insertion**:
   * Adds the user with `status: "inactive"`, `approvalStatus: "pending"`, and `emailVerified: false`.
4. **Audit Entry**:
   * Writes a transaction log into the audit collection.
5. **OTP Response**:
   * Returns the database `userId` and the generated `otpCode`.

### The Frontend Page Logic (`app/(auth)/register/page.tsx`)
1. **Document Validation**:
   * Enforces that a Passport copy (`Passport`) and a Visa/ID copy (`Visa ID`) **must** be uploaded.
   * Limits profile photo files to **5MB** and PNG/JPG.
   * Limits documents to **10MB** and PDFs/PNGs/JPGs (with Insurance certificates restricted strictly to PDF format).
2. **Upload & Submit Process**:
   * Generates upload URLs and uploads files to Convex storage first.
   * Calls `registerUser` with form inputs and document references.
   * Advances the user to the **OTP Verification step**.
3. **OTP & Activation**:
   * The user enters the OTP code.
   * Upon successful verification, the account moves to a pending super-admin review state.
   * A Super Admin must approve the registration inside the dashboard to activate the user (`status: "active"` and `approvalStatus: "approved"`).

### 🔍 Potential Points of Failure (Why registration might fail)
1. **Empty Database (Missing Roles/Companies)**:
   * The registration queries `roles` matching `args.roleName`. If the database is completely empty (i.e. the seeder has not run), it throws: `throw new Error("Target system role '...' not found.")`.
   * Similarly, it queries the first `companies` document. If no company exists, it resolves `companyId` to `undefined`, which is permissible in the schema but might cause frontend display errors later.
2. **Duplicate Phone Scan Overhead**:
   * `const existingPhone = await ctx.db.query("users").collect();`
   * It scans the **entire** user base in memory to check if a phone exists: `existingPhone.some((u) => u.phone === args.phone.trim())`. While this works, it can fail on large datasets or cause OCC (Optimistic Concurrency Control) timeouts.
3. **Validation Format Mismatch**:
   * Zod regex validation for `phone` on the frontend is `/^[+0-9\s-]{8,20}$/`. If the entered phone doesn't match this, the form submission will block silently (showing error text below the input field).
   * Password requirements are strict (must have an uppercase letter, lowercase letter, number, and special character). If any are missing, client-side validation blocks submission.
