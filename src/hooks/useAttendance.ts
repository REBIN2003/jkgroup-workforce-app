"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAttendance(userId?: string, date?: string) {
  const todayRecord = useQuery(
    api.attendance.getTodayAttendance,
    userId ? { userId: userId as any } : "skip"
  );

  const logs = useQuery(api.attendance.listAttendanceLogs, {
    userId: userId ? (userId as any) : undefined,
    date: date || undefined,
  }) || [];

  const clockInMut = useMutation(api.attendance.clockIn);
  const clockOutMut = useMutation(api.attendance.clockOut);
  const startBreakMut = useMutation(api.attendance.startBreak);
  const endBreakMut = useMutation(api.attendance.endBreak);

  return {
    todayRecord,
    logs,
    clockIn: clockInMut,
    clockOut: clockOutMut,
    startBreak: startBreakMut,
    endBreak: endBreakMut,
  };
}
