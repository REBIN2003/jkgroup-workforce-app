"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useLeave(userId?: string) {
  const leaveRequests = useQuery(api.leaves.listLeaveRequests, {
    userId: userId ? (userId as any) : undefined,
  }) || [];

  const createLeaveMut = useMutation(api.leaves.createLeaveRequest);

  return {
    leaveRequests,
    createLeaveRequest: createLeaveMut,
  };
}
