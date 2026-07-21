import { z } from "zod";

export const userFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid corporate email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  employeeId: z.string().min(3, "Employee ID is required (e.g. EMP-1002)"),
  roleId: z.string().min(1, "Role selection is required"),
  companyId: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  status: z.enum(["active", "inactive", "suspended"]),
});

export const userEditSchema = userFormSchema.extend({
  password: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
export type UserEditFormValues = z.infer<typeof userEditSchema>;
