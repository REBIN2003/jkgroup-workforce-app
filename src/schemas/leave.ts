import { z } from "zod";

export const leaveFormSchema = z.object({
  leaveType: z.enum(["annual", "sick", "casual", "unpaid"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Please provide a reason (at least 5 characters)"),
});

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;
