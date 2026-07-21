import { v } from "convex/values";
import { query } from "./_generated/server";

export const generateEnterpriseReportData = query({
  args: {
    reportSubject: v.union(
      v.literal("employee"),
      v.literal("project"),
      v.literal("attendance"),
      v.literal("leave")
    ),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    date: v.optional(v.string()), // YYYY-MM-DD
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    if (args.reportSubject === "employee") {
      const users = await ctx.db.query("users").collect();
      const result = [];
      for (const u of users) {
        const role = await ctx.db.get(u.roleId);
        const comp = u.companyId ? await ctx.db.get(u.companyId) : null;
        result.push({
          id: u.employeeId,
          name: u.fullName,
          email: u.email,
          role: role?.name || "Employee",
          company: comp?.name || "N/A",
          phone: u.phone || "N/A",
          status: u.status.toUpperCase(),
        });
      }
      return { title: "Workforce Directory Report", headers: ["Emp ID", "Full Name", "Email", "Role", "Company", "Phone", "Status"], rows: result };
    }

    if (args.reportSubject === "project") {
      const projects = await ctx.db.query("projects").collect();
      const result = [];
      for (const p of projects) {
        const comp = await ctx.db.get(p.companyId);
        const pm = p.projectManagerId ? await ctx.db.get(p.projectManagerId) : null;
        result.push({
          code: p.code,
          name: p.name,
          company: comp?.name || "N/A",
          manager: pm?.fullName || "Unassigned",
          startDate: p.startDate,
          budget: p.budget ? `$${p.budget.toLocaleString()}` : "N/A",
          status: p.status.toUpperCase(),
        });
      }
      return { title: "Enterprise Projects Report", headers: ["Project Code", "Project Name", "Company", "Manager", "Start Date", "Budget", "Status"], rows: result };
    }

    if (args.reportSubject === "attendance") {
      let logs = await ctx.db.query("attendance").collect();
      if (args.date) {
        logs = logs.filter((l) => l.date === args.date);
      }
      const result = [];
      for (const l of logs) {
        const u = await ctx.db.get(l.userId);
        const proj = l.projectId ? await ctx.db.get(l.projectId) : null;
        result.push({
          employeeId: u?.employeeId || "N/A",
          name: u?.fullName || "Unknown",
          date: l.date,
          clockIn: new Date(l.clockInTime).toLocaleTimeString(),
          breakMins: `${l.totalBreakMinutes || 0} mins`,
          clockOut: l.clockOutTime ? new Date(l.clockOutTime).toLocaleTimeString() : "--:--",
          project: proj?.name || "General Office",
          status: l.status.toUpperCase(),
        });
      }
      return { title: "Workforce Attendance Matrix Report", headers: ["Emp ID", "Name", "Date", "Clock In", "Break Mins", "Clock Out", "Project", "Status"], rows: result };
    }

    // Leave Report
    let leaves = await ctx.db.query("leave_requests").collect();
    const result = [];
    for (const r of leaves) {
      const u = await ctx.db.get(r.userId);
      const approver = r.approvedBy ? await ctx.db.get(r.approvedBy) : null;
      result.push({
        employeeId: u?.employeeId || "N/A",
        name: u?.fullName || "Unknown",
        leaveType: r.leaveType.toUpperCase(),
        range: `${r.startDate} to ${r.endDate}`,
        reason: r.reason,
        status: r.status.toUpperCase(),
        approver: approver?.fullName || "N/A",
      });
    }
    return { title: "Employee Leave Applications Report", headers: ["Emp ID", "Name", "Leave Type", "Date Range", "Reason", "Status", "Approver"], rows: result };
  },
});
