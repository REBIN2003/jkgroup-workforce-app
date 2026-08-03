export type RoleName = "Super Admin" | "General Manager" | "Project Manager" | "Employee";

export interface AddressInfo {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface EmergencyContactInfo {
  name: string;
  relationship: string;
  phone: string;
}

export interface BankDetailsInfo {
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
}

export interface TaxDetailsInfo {
  taxId?: string;
  taxCategory?: string;
}

export interface SystemUser {
  _id: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName?: RoleName;
  companyId?: string;
  companyName?: string;
  employeeId: string;
  phone?: string;
  profileImageStorageId?: string;
  profileImageUrl?: string;
  address?: AddressInfo;
  emergencyContact?: EmergencyContactInfo;
  bankDetails?: BankDetailsInfo;
  taxDetails?: TaxDetailsInfo;
  status: "active" | "inactive" | "suspended";
  createdAt: number;
  updatedAt: number;
}

export interface SystemRole {
  _id: string;
  name: RoleName;
  description: string;
  isSystem: boolean;
  createdAt: number;
}

export interface Permission {
  _id: string;
  code: string;
  module: string;
  description: string;
}

export interface Company {
  _id: string;
  name: string;
  code: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive";
  createdAt: number;
}

export interface Project {
  _id: string;
  companyId: string;
  name: string;
  code: string;
  projectManagerId?: string;
  startDate: string;
  endDate?: string;
  status: "planned" | "active" | "completed" | "on_hold";
  budget?: number;
  description?: string;
  createdAt: number;
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  userName?: string;
  projectId?: string;
  projectName?: string;
  companyId: string;
  date: string;
  clockInTime: number;
  breakStartTime?: number;
  breakEndTime?: number;
  totalBreakMinutes?: number;
  clockOutTime?: number;
  clockInPhotoId?: string;
  clockOutPhotoId?: string;
  status: "present" | "absent" | "late" | "half_day" | "on_break";
  remarks?: string;
  createdAt: number;
}

export interface DailyHours {
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
}

export interface TimeRegistration {
  _id: string;
  userId: string;
  userName?: string;
  companyId: string;
  projectId?: string;
  projectName?: string;
  year: number;
  weekNumber: number;
  dailyHours: DailyHours;
  totalHours: number;
  expenses?: number;
  travelKm?: number;
  description?: string;
  attachmentStorageId?: string;
  attachmentUrl?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: number;
  approvedBy?: string;
  createdAt: number;
}

export interface LeaveRequest {
  _id: string;
  userId: string;
  userName?: string;
  employeeId?: string;
  companyId: string;
  leaveType: "annual" | "sick" | "casual" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  attachmentStorageId?: string;
  attachmentUrl?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  createdAt: number;
}

export interface SystemDocument {
  _id: string;
  userId: string;
  userName?: string;
  companyId: string;
  title: string;
  documentType: "contract" | "passport" | "driving_license" | "visa" | "certificate" | "id_proof" | "report" | "other";
  storageId: string;
  fileSize: number;
  fileType: string;
  expiryDate?: string;
  uploadedBy: string;
  fileUrl?: string;
  createdAt: number;
}

export interface WorkPhotoRecord {
  _id: string;
  attendanceId?: string;
  userId: string;
  projectId?: string;
  projectName?: string;
  storageId: string;
  fileUrl?: string;
  photoType: "clock_in" | "clock_out" | "site_work";
  notes?: string;
  timestamp: number;
}

export interface AuditLogItem {
  _id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  timestamp: number;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  children?: NavigationItem[];
}
