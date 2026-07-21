"use client";

import React from "react";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { useAuth } from "../../../src/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  // Queries
  const todayAttendance = useQuery(
    api.attendance.getTodayAttendance,
    user?._id ? { userId: user._id as any } : "skip"
  );

  const userLeaveRequests = useQuery(
    api.leaves.listLeaveRequests,
    user?._id ? { userId: user._id as any } : "skip"
  ) || [];

  const userTimesheets = useQuery(
    api.time_registration.listTimesheets,
    user?._id ? { userId: user._id as any } : "skip"
  ) || [];

  const projects = useQuery(api.projects.listProjects, {}) || [];
  const activeProject = projects[0];

  const pendingLeaves = userLeaveRequests.filter((r: any) => r.status === "pending").length;
  const approvedLeaves = userLeaveRequests.filter((r: any) => r.status === "approved").length;
  const remainingLeaveDays = Math.max(0, 20 - approvedLeaves * 2);

  const isClockedIn = Boolean(todayAttendance && !todayAttendance.clockOutTime);
  const isOnBreak = Boolean(todayAttendance && todayAttendance.status === "on_break");

  return (
    <div>
      <EnterprisePageHeader
        title="Enterprise System Dashboard"
        subtitle="Operational overview, workforce statistics, and employee self-service hub"
        breadcrumbs={[{ label: "Overview" }]}
        actions={
          <div className="d-flex gap-2">
            <Link href="/attendance" className="btn btn-erp-danger btn-sm">
              <i className="bi bi-clock-history me-1"></i> CLOCK IN / OUT
            </Link>
            <Link href="/time-registration" className="btn btn-erp-primary btn-sm">
              <i className="bi bi-calendar-range me-1"></i> REGISTER HOURS
            </Link>
          </div>
        }
      />

      {/* Summary Widgets Strip */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">TODAY'S ATTENDANCE</span>
            <div className="fs-5 fw-bold mt-1">
              {todayAttendance ? (
                <span
                  className={`badge ${
                    isOnBreak
                      ? "bg-warning text-dark"
                      : todayAttendance.status === "present"
                      ? "bg-success"
                      : "bg-danger"
                  } rounded-0`}
                >
                  {isOnBreak ? "ON BREAK" : todayAttendance.status.toUpperCase()}
                </span>
              ) : (
                <span className="badge bg-secondary rounded-0">NOT CLOCKED IN</span>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">LEAVE BALANCE</span>
            <div className="fs-3 fw-bold text-success mt-1">{remainingLeaveDays} Days</div>
            <small className="text-muted">Annual Allowance Remaining</small>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">PENDING APPROVALS</span>
            <div className="fs-3 fw-bold text-warning mt-1">{pendingLeaves}</div>
            <small className="text-muted">Leave Applications Pending</small>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">ASSIGNED PROJECTS</span>
            <div className="fs-3 fw-bold text-primary mt-1">{projects.length}</div>
            <small className="text-muted">Active Work Assignments</small>
          </div>
        </div>
      </div>

      {/* Current Account Details & Current Project Card */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card card-erp h-100">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <span><i className="bi bi-person-badge me-2"></i>CURRENT ACCOUNT DETAILS</span>
              <span className="badge bg-primary">{user?.roleName}</span>
            </div>
            <div className="card-body p-3">
              <div className="row g-3 small">
                <div className="col-6">
                  <strong className="text-muted d-block">Employee Name:</strong>
                  <span className="text-dark fw-bold">{user?.fullName}</span>
                </div>
                <div className="col-6">
                  <strong className="text-muted d-block">Corporate Email:</strong>
                  <span className="text-dark">{user?.email}</span>
                </div>
                <div className="col-6">
                  <strong className="text-muted d-block">Employee ID:</strong>
                  <span className="text-dark">{user?.employeeId}</span>
                </div>
                <div className="col-6">
                  <strong className="text-muted d-block">Assigned Role:</strong>
                  <span className="text-dark">{user?.roleName}</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-top text-end">
                <Link href="/profile" className="btn btn-outline-secondary btn-sm rounded-0">
                  <i className="bi bi-gear me-1"></i> Edit Profile & Bank Details
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card card-erp h-100">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <span><i className="bi bi-diagram-3 me-2"></i>CURRENT PRIMARY PROJECT</span>
              {activeProject && (
                <span className="badge bg-success rounded-0">{activeProject.status.toUpperCase()}</span>
              )}
            </div>
            <div className="card-body p-3">
              {activeProject ? (
                <div>
                  <h6 className="fw-bold text-dark mb-1">{activeProject.name} ({activeProject.code})</h6>
                  <div className="small text-muted mb-2">Employer: <strong>{activeProject.companyName}</strong></div>
                  <p className="small text-muted mb-3">{activeProject.description || "Active enterprise project assignment."}</p>
                  <div className="d-flex justify-content-between align-items-center border-top pt-2">
                    <span className="small text-muted">Manager: {activeProject.projectManagerName}</span>
                    <Link href="/my-projects" className="btn btn-erp-primary btn-sm">View Project Details</Link>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-4">No active projects assigned.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Tables Row */}
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card card-erp">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <span><i className="bi bi-calendar-check me-2"></i>YOUR RECENT LEAVE REQUESTS</span>
              <Link href="/leave-requests" className="small text-primary text-decoration-none">Apply Leave</Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table erp-table table-bordered table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLeaveRequests.length > 0 ? (
                      userLeaveRequests.slice(0, 5).map((r: any) => (
                        <tr key={r._id}>
                          <td><span className="badge bg-secondary rounded-0 text-uppercase">{r.leaveType}</span></td>
                          <td>{r.startDate}</td>
                          <td>{r.endDate}</td>
                          <td className="text-truncate" style={{ maxWidth: "200px" }}>{r.reason}</td>
                          <td>
                            <span
                              className={`badge ${
                                r.status === "approved"
                                  ? "bg-success"
                                  : r.status === "rejected"
                                  ? "bg-danger"
                                  : "bg-warning text-dark"
                              } rounded-0`}
                            >
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-3">
                          No leave applications submitted yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card card-erp">
            <div className="card-header py-2">
              <i className="bi bi-bell me-2"></i>SYSTEM NOTIFICATIONS & SHORTCUTS
            </div>
            <div className="list-group list-group-flush rounded-0 small">
              <div className="list-group-item p-3">
                <div className="d-flex w-100 justify-content-between mb-1">
                  <strong className="text-dark">Weekly Timesheet Reminder</strong>
                  <small className="text-muted">Today</small>
                </div>
                <p className="mb-0 text-muted">Please register Mon-Sun working hours before end of week.</p>
              </div>

              <Link href="/time-registration" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <span><i className="bi bi-calendar-range me-2 text-primary"></i> Register Hours</span>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
              <Link href="/documents" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <span><i className="bi bi-file-earmark-text me-2 text-primary"></i> Document Vault</span>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
              <Link href="/profile" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <span><i className="bi bi-bank me-2 text-primary"></i> Bank & Tax Details</span>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
