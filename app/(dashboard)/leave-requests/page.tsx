"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { LeaveRequestModal } from "../../../src/features/leave/LeaveRequestModal";
import { LeaveFormValues } from "../../../src/schemas/leave";
import { useAuth } from "../../../src/hooks/useAuth";

export default function LeaveRequestsPage() {
  const { user, hasPermission } = useAuth();
  const [activeStatus, setActiveStatus] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Can approve leaves if Super Admin, General Manager, or Project Manager (or has PERMISSIONS.LEAVE_APPROVE)
  const canApprove = hasPermission("leave:approve");

  // Queries & Mutations
  const requests = useQuery(api.leaves.listLeaveRequests, {
    status: activeStatus || undefined,
  }) || [];

  const createLeaveMut = useMutation(api.leaves.createLeaveRequest);
  const updateStatusMut = useMutation(api.leaves.updateLeaveStatus);

  const handleCreateSubmit = async (values: LeaveFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await createLeaveMut({
        userId: user._id as any,
        companyId: user.companyId || (user as any)._id,
        leaveType: values.leaveType,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
      });
      setFeedback("Leave request submitted successfully for manager approval.");
    } catch (err: any) {
      alert(err.message || "Failed to submit leave request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (leaveId: string, status: "approved" | "rejected") => {
    if (!user) return;
    try {
      await updateStatusMut({
        leaveId: leaveId as any,
        status,
        actorId: user._id as any,
      });
      setFeedback(`Leave request marked as ${status}.`);
    } catch (err: any) {
      alert(err.message || "Failed to update leave status.");
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div>
      <EnterprisePageHeader
        title="Leave Applications & Manager Approval Pipeline"
        subtitle="Submit time-off requests, track approval workflows, and review department leave schedules"
        breadcrumbs={[{ label: "Leave Requests" }]}
        actions={
          <button
            type="button"
            className="btn btn-erp-danger btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-file-earmark-plus me-1"></i> APPLY FOR LEAVE
          </button>
        }
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Summary Counters Strip */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">PENDING REVIEW</span>
            <div className="fs-3 fw-bold text-warning">{pendingCount}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">APPROVED REQUESTS</span>
            <div className="fs-3 fw-bold text-success">{approvedCount}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">REJECTED REQUESTS</span>
            <div className="fs-3 fw-bold text-danger">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="card card-erp">
        <div className="card-header py-2 bg-light border-bottom">
          <ul className="nav nav-tabs card-header-tabs rounded-0">
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeStatus === "" ? "active fw-bold" : "text-secondary"}`}
                onClick={() => setActiveStatus("")}
              >
                All Applications ({requests.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeStatus === "pending" ? "active fw-bold text-warning" : "text-secondary"}`}
                onClick={() => setActiveStatus("pending")}
              >
                Pending Approval
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeStatus === "approved" ? "active fw-bold text-success" : "text-secondary"}`}
                onClick={() => setActiveStatus("approved")}
              >
                Approved
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeStatus === "rejected" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveStatus("rejected")}
              >
                Rejected
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Employee Name</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  {canApprove && <th>Manager Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((r: any) => (
                    <tr key={r._id}>
                      <td><strong>{r.employeeId}</strong></td>
                      <td>{r.userName}</td>
                      <td><span className="badge bg-secondary rounded-0 text-uppercase">{r.leaveType}</span></td>
                      <td>{r.startDate} to {r.endDate}</td>
                      <td style={{ maxWidth: "240px" }} className="text-truncate">{r.reason}</td>
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
                      <td>{r.approverName}</td>
                      {canApprove && (
                        <td>
                          {r.status === "pending" ? (
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-erp-primary btn-sm py-0 px-2"
                                onClick={() => handleAction(r._id, "approved")}
                              >
                                APPROVE
                              </button>
                              <button
                                type="button"
                                className="btn btn-erp-danger btn-sm py-0 px-2"
                                onClick={() => handleAction(r._id, "rejected")}
                              >
                                REJECT
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={canApprove ? 8 : 7} className="text-center text-muted py-4">
                      No leave requests found for this filter tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
