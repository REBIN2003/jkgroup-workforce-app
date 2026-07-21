import { z } from "zod";

export const timeRegistrationSchema = z.object({
  year: z.number().min(2020).max(2030),
  weekNumber: z.number().min(1).max(53),
  projectId: z.string().optional(),
  mon: z.number().min(0).max(24),
  tue: z.number().min(0).max(24),
  wed: z.number().min(0).max(24),
  thu: z.number().min(0).max(24),
  fri: z.number().min(0).max(24),
  sat: z.number().min(0).max(24),
  sun: z.number().min(0).max(24),
  expenses: z.number().min(0).optional(),
  travelKm: z.number().min(0).optional(),
  description: z.string().optional(),
});

export type TimeRegistrationFormValues = z.infer<typeof timeRegistrationSchema>;
