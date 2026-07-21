/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as approvals from "../approvals.js";
import type * as attendance from "../attendance.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as companies from "../companies.js";
import type * as documents from "../documents.js";
import type * as holidays from "../holidays.js";
import type * as leaves from "../leaves.js";
import type * as notifications from "../notifications.js";
import type * as projects from "../projects.js";
import type * as registrations from "../registrations.js";
import type * as reports from "../reports.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as settings from "../settings.js";
import type * as time_registration from "../time_registration.js";
import type * as users from "../users.js";
import type * as work_photos from "../work_photos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  approvals: typeof approvals;
  attendance: typeof attendance;
  audit: typeof audit;
  auth: typeof auth;
  companies: typeof companies;
  documents: typeof documents;
  holidays: typeof holidays;
  leaves: typeof leaves;
  notifications: typeof notifications;
  projects: typeof projects;
  registrations: typeof registrations;
  reports: typeof reports;
  roles: typeof roles;
  seed: typeof seed;
  sessions: typeof sessions;
  settings: typeof settings;
  time_registration: typeof time_registration;
  users: typeof users;
  work_photos: typeof work_photos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
