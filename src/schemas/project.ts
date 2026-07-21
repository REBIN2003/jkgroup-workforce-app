import { z } from "zod";

export const projectFormSchema = z.object({
  companyId: z.string().min(1, "Company selection is required"),
  name: z.string().min(2, "Project name must be at least 2 characters"),
  code: z.string().min(2, "Project code is required (e.g. PRJ-2026-A)"),
  projectManagerId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  status: z.enum(["planned", "active", "completed", "on_hold"]),
  budget: z.number().optional(),
  description: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
