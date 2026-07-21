"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { DigitalSignatureCanvas } from "../../../src/components/signature/DigitalSignatureCanvas";
import { BootstrapModal } from "../../../src/components/modal/BootstrapModal";
import { useAuth } from "../../../src/hooks/useAuth";

export default function ManagerApprovalsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"leave" | "timesheet" | "photo">("leave");
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Queries
  const leaveRequests = useQuery(api.leaves.listLeaveRequests, {}) || [];
  const timesheets = useQuery(api.time_registration.listTimesheets, {}) || [];
  const workPhotos = useQuery(api.work_photos.listWorkPhotos, {}) || [];

  // Mutations
  const approveLeaveMut = useMutation(api.approvals.approveLeaveRequest);
  const approveTimesheetMut = useMutation(api.approvals.approveTimesheet);

  const handleSignatureCaptured = async (signatureStorageId: string) => {
    if (!user || !selectedEntity) return;
    try {
      if (activeTab === "leave") {
        await approveLeaveMut({
          leaveId: selectedEntity._id,
          actorId: user._id as any,
          signatureStorageId: signatureStorageId as any,
          comment: comment || undefined,
          status: actionType,
        });
        setFeedback(`Leave request ${actionType} with digital signature and locked.`);
      } else if (activeTab === "timesheet") {
        await approveTimesheetMut({
          timesheetId: selectedEntity._id,
          actorId: user._id as any,
          signatureStorageId: signatureStorageId as any,
          comment: comment || undefined,
          status: actionType,
        });
        setFeedback(`Weekly timesheet ${actionType} with digital signature and locked.`);
      }

      setSelectedEntity(null);
      setComment("");
    } catch (err: any) {
      alert(err.message || "Approval failed.");
    }
  };

  const pendingLeaves = leaveRequests.filter((r: any) => r.status === "pending").length;
  const pendingTimesheets = timesheets.filter((t: any) => t.status === "submitted").length;

  return (
    <div>
      <EnterprisePageHeader
        title="Manager & General Manager Approvals Hub"
        subtitle="Review employee submissions, perform digital signature approvals, and enforce cryptographic approval locks"
        breadcrumbs={[{ label: "Manager Approvals" }]}
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Counter Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">PENDING LEAVE APPLICATIONS</span>
            <div className="fs-3 fw-bold text-warning">{pendingLeaves}</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">PENDING WEEKLY TIMESHEETS</span>
            <div className="fs-3 fw-bold text-primary">{pendingTimesheets}</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">TOTAL WORK PHOTOS CAPTURED</span>
            <div className="fs-3 fw-bold text-secondary">{workPhotos.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="card card-erp">
        <div className="card-header py-2 bg-light border-bottom">
          <ul className="nav nav-tabs card-header-tabs rounded-0">
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeTab === "leave" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveTab("leave")}
              >
                <i className="bi bi-calendar-check me-1"></i> Leave Applications ({leaveRequests.length})
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeTab === "timesheet" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveTab("timesheet")}
              >
                <i className="bi bi-clock-history me-1"></i> Weekly Timesheets ({timesheets.length})
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeTab === "photo" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveTab("photo")}
              >
                <i className="bi bi-camera me-1"></i> Camera Work Photos ({workPhotos.length})
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-0">
          {/* Tab 1: Leave Requests Table */}
          {activeTab === "leave" && (
            <div className="table-responsive">
              <table className="table erp-table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Employee Name</th>
                    <th>Leave Type</th>
                    <th>Date Range</th>
                    <th>Reason</th>
                    <th>Status / Lock</th>
                    <th>Manager Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length > 0 ? (
                    leaveRequests.map((r: any) => (
                      <tr key={r._id}>
                        <td><strong>{r.employeeId}</strong></td>
                        <td>{r.userName}</td>
                        <td><span className="badge bg-secondary rounded-0 text-uppercase">{r.leaveType}</span></td>
                        <td>{r.startDate} to {r.endDate}</td>
                        <td className="text-truncate" style={{ maxWidth: "200px" }}>{r.reason}</td>
                        <td>
                          <span
                            className={`badge ${
                              r.status === "approved"
                                ? "bg-success"
                                : r.status === "rejected"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                            } rounded-0 me-1`}
                          >
                            {r.status.toUpperCase()}
                          </span>
                          {r.status !== "pending" && (
                            <i className="bi bi-lock-fill text-muted" title="Approval Locked"></i>
                          )}
                        </td>
                        <td>
                          {r.status === "pending" ? (
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-erp-primary btn-sm py-0 px-2"
                                onClick={() => {
                                  setSelectedEntity(r);
                                  setActionType("approved");
                                }}
                              >
                                <i className="bi bi-pen me-1"></i> SIGN & APPROVE
                              </button>
                              <button
                                type="button"
                                className="btn btn-erp-danger btn-sm py-0 px-2"
                                onClick={() => {
                                  setSelectedEntity(r);
                                  setActionType("rejected");
                                }}
                              >
                                REJECT
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">
                              <i className="bi bi-shield-check text-success me-1"></i> Signed by {r.approverName}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">No leave applications found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Timesheets Table */}
          {activeTab === "timesheet" && (
            <div className="table-responsive">
              <table className="table erp-table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Employee Name</th>
                    <th>Period</th>
                    <th>Project</th>
                    <th>Total Hours</th>
                    <th>Expenses</th>
                    <th>Status / Lock</th>
                    <th>Manager Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.length > 0 ? (
                    timesheets.map((t: any) => (
                      <tr key={t._id}>
                        <td><strong>{t.employeeId}</strong></td>
                        <td>{t.userName}</td>
                        <td>Year {t.year} - W{t.weekNumber}</td>
                        <td>{t.projectName}</td>
                        <td><strong>{t.totalHours} hrs</strong></td>
                        <td>${t.expenses || 0}</td>
                        <td>
                          <span
                            className={`badge ${
                              t.status === "approved"
                                ? "bg-success"
                                : t.status === "rejected"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                            } rounded-0 me-1`}
                          >
                            {t.status.toUpperCase()}
                          </span>
                          {t.status === "approved" && (
                            <i className="bi bi-lock-fill text-muted" title="Approval Locked"></i>
                          )}
                        </td>
                        <td>
                          {t.status === "submitted" ? (
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-erp-primary btn-sm py-0 px-2"
                                onClick={() => {
                                  setSelectedEntity(t);
                                  setActionType("approved");
                                }}
                              >
                                <i className="bi bi-pen me-1"></i> SIGN & APPROVE
                              </button>
                              <button
                                type="button"
                                className="btn btn-erp-danger btn-sm py-0 px-2"
                                onClick={() => {
                                  setSelectedEntity(t);
                                  setActionType("rejected");
                                }}
                              >
                                REJECT
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">No weekly timesheets submitted.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Work Photos Grid */}
          {activeTab === "photo" && (
            <div className="p-3">
              <div className="row g-3">
                {workPhotos.length > 0 ? (
                  workPhotos.map((p: any) => (
                    <div key={p._id} className="col-md-3 col-sm-6">
                      <div className="card card-erp h-100">
                        <img
                          src={p.fileUrl}
                          alt="Work Snap"
                          className="card-img-top border-bottom"
                          style={{ height: "180px", objectFit: "cover" }}
                        />
                        <div className="card-body p-2 small">
                          <strong className="d-block text-dark">{p.userName} ({p.employeeId})</strong>
                          <span className="text-muted d-block">{p.projectName}</span>
                          <small className="text-muted">{new Date(p.timestamp).toLocaleString()}</small>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center text-muted py-4">No camera work photos captured yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Digital Signature Approval Modal */}
      {selectedEntity && (
        <BootstrapModal
          isOpen={Boolean(selectedEntity)}
          onClose={() => setSelectedEntity(null)}
          title={`DIGITAL SIGNATURE & CONFIRMATION: ${actionType.toUpperCase()}`}
          size="lg"
        >
          <div className="mb-3">
            <div className="alert alert-secondary rounded-0 py-2 small mb-3">
              Confirming <strong>{actionType}</strong> status for item ID: <strong>{selectedEntity._id}</strong>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small">Approval / Rejection Comments</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Enter managerial review comments or reasons..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>

            <DigitalSignatureCanvas
              onSignatureCaptured={handleSignatureCaptured}
              onCancel={() => setSelectedEntity(null)}
            />
          </div>
        </BootstrapModal>
      )}
    </div>
  );
}
