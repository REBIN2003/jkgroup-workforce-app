"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../../../../src/hooks/useAuth";
import { Id } from "../../../../convex/_generated/dataModel";

export default function PendingRegistrationsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "Super Admin";
  const isGeneralManager = user?.roleName === "General Manager";

  // Filter States
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [rejectingApplicant, setRejectingApplicant] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Alert Feedback State
  const [alertInfo, setAlertInfo] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Deployed Live Convex Queries & Mutations
  const rawUsers = useQuery(api.users.listUsers, {}) || [];
  const roles = useQuery(api.users.listRoles, {}) || [];

  const approveRegistrationMut = useMutation(api.registrations.approveRegistration);
  const rejectRegistrationMut = useMutation(api.registrations.rejectRegistration);
  const deleteRegistrationMut = useMutation(api.registrations.deleteRegistration);

  // Client-Side Pending Registrations Filtering
  const registrationsList = rawUsers.filter((u: any) => {
    // 1. Status Filter
    const appStatus = u.approvalStatus || (u.status === "active" ? "approved" : "pending");
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && appStatus !== "pending") return false;
      if (statusFilter === "approved" && appStatus !== "approved") return false;
      if (statusFilter === "rejected" && appStatus !== "rejected") return false;
    }

    // 2. Role Filter
    const userRole = u.requestedRoleName || u.roleName || "Employee";
    if (roleFilter !== "all" && userRole !== roleFilter) return false;

    // 3. Search Filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      const matchName = u.fullName?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }

    return true;
  });

  // Summary Metrics
  const totalCount = rawUsers.length;
  const pendingCount = rawUsers.filter((r: any) => (r.approvalStatus || (r.status === "active" ? "approved" : "pending")) === "pending").length;
  const approvedCount = rawUsers.filter((r: any) => (r.approvalStatus || (r.status === "active" ? "approved" : "pending")) === "approved").length;
  const rejectedCount = rawUsers.filter((r: any) => r.approvalStatus === "rejected" || r.status === "suspended").length;

  // Approve Handler
  const handleApprove = async (applicant: any) => {
    if (!isSuperAdmin) {
      setAlertInfo({ type: "danger", message: "Only Super Admin users can approve registrations." });
      return;
    }
    setIsProcessing(true);
    setAlertInfo(null);
    try {
      await approveRegistrationMut({
        userId: applicant._id as Id<"users">,
        actorId: user?._id,
      });

      setAlertInfo({ type: "success", message: `Registration for ${applicant.fullName} approved successfully.` });
      setSelectedApplicant(null);
    } catch (err: any) {
      setAlertInfo({ type: "danger", message: err.message || "Failed to approve registration." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Handler
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingApplicant || !isSuperAdmin) return;
    if (!rejectionReason.trim()) {
      setAlertInfo({ type: "danger", message: "Please enter a reason for rejecting the registration." });
      return;
    }
    setIsProcessing(true);
    setAlertInfo(null);
    try {
      await rejectRegistrationMut({
        userId: rejectingApplicant._id as Id<"users">,
        actorId: user?._id,
        reason: rejectionReason.trim(),
      });

      setAlertInfo({ type: "success", message: `Registration for ${rejectingApplicant.fullName} rejected.` });
      setRejectingApplicant(null);
      setRejectionReason("");
    } catch (err: any) {
      setAlertInfo({ type: "danger", message: err.message || "Failed to reject registration." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Handler
  const handleDelete = async (userId: Id<"users">, name: string) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Are you sure you want to permanently delete registration record for ${name}?`)) return;
    setIsProcessing(true);
    try {
      await deleteRegistrationMut({ userId: userId, actorId: user?._id });
      setAlertInfo({ type: "success", message: `Registration record for ${name} deleted.` });
    } catch (err: any) {
      setAlertInfo({ type: "danger", message: err.message || "Failed to delete record." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSuperAdmin && !isGeneralManager) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger py-4">
          <i className="bi bi-shield-lock-fill display-4 d-block mb-3"></i>
          <h4 className="fw-bold">ACCESS RESTRICTED</h4>
          <p className="mb-0">Only Super Admin and General Manager accounts can access pending user registrations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            <i className="bi bi-person-check-fill me-2 text-erp-primary"></i>
            PENDING USER REGISTRATIONS
          </h3>
          <p className="text-muted small mb-0">
            Review public workforce account requests, verification documents, and approval workflows.
          </p>
        </div>
        {isGeneralManager && (
          <span className="badge bg-secondary px-3 py-2">
            <i className="bi bi-eye-fill me-1"></i> General Manager (Read-Only)
          </span>
        )}
      </div>

      {/* Alert Notifications */}
      {alertInfo && (
        <div className={`alert alert-${alertInfo.type} rounded-0 py-2 small mb-4`} role="alert">
          <i className={`bi bi-${alertInfo.type === "success" ? "check-circle" : "exclamation-triangle"}-fill me-2`}></i>
          {alertInfo.message}
        </div>
      )}

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card card-erp shadow-sm border-start border-primary border-4">
            <div className="card-body p-3">
              <span className="text-muted small d-block">TOTAL ACCOUNTS</span>
              <h3 className="fw-bold text-dark mb-0">{totalCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-erp shadow-sm border-start border-warning border-4">
            <div className="card-body p-3">
              <span className="text-muted small d-block">PENDING APPROVAL</span>
              <h3 className="fw-bold text-warning mb-0">{pendingCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-erp shadow-sm border-start border-success border-4">
            <div className="card-body p-3">
              <span className="text-muted small d-block">APPROVED ACCOUNTS</span>
              <h3 className="fw-bold text-success mb-0">{approvedCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-erp shadow-sm border-start border-danger border-4">
            <div className="card-body p-3">
              <span className="text-muted small d-block">REJECTED / SUSPENDED</span>
              <h3 className="fw-bold text-danger mb-0">{rejectedCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card card-erp shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            {/* Status Filter Tabs */}
            <div className="col-md-5">
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${statusFilter === "pending" ? "btn-warning fw-bold text-dark" : "btn-outline-secondary"}`}
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${statusFilter === "approved" ? "btn-success fw-bold" : "btn-outline-secondary"}`}
                  onClick={() => setStatusFilter("approved")}
                >
                  Approved
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${statusFilter === "rejected" ? "btn-danger fw-bold" : "btn-outline-secondary"}`}
                  onClick={() => setStatusFilter("rejected")}
                >
                  Rejected
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${statusFilter === "all" ? "btn-dark fw-bold" : "btn-outline-secondary"}`}
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </button>
              </div>
            </div>

            {/* Role Filter */}
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Requested Roles</option>
                <option value="Employee">Employee</option>
                <option value="Project Manager">Project Manager</option>
                <option value="General Manager">General Manager</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="card card-erp shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-dark small">
                <tr>
                  <th className="ps-3">APPLICANT</th>
                  <th>ROLE REQUESTED</th>
                  <th>CONTACT & COUNTRY</th>
                  <th>REGISTRATION DATE</th>
                  <th>STATUS</th>
                  <th className="text-end pe-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {registrationsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      <i className="bi bi-inbox display-6 d-block mb-2 text-secondary"></i>
                      No registrations found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  registrationsList.map((item: any) => {
                    const currentStatus = item.approvalStatus || (item.status === "active" ? "approved" : "pending");
                    return (
                      <tr key={item._id}>
                        {/* Applicant Name & Avatar */}
                        <td className="ps-3">
                          <div className="d-flex align-items-center">
                            {item.profileImageUrl ? (
                              <img
                                src={item.profileImageUrl}
                                alt={item.fullName}
                                className="rounded-circle me-3 border"
                                style={{ width: "40px", height: "40px", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3 fw-bold"
                                style={{ width: "40px", height: "40px" }}
                              >
                                {item.fullName ? item.fullName.substring(0, 2).toUpperCase() : "U"}
                              </div>
                            )}
                            <div>
                              <div className="fw-bold text-dark">{item.fullName}</div>
                              <small className="text-muted">{item.email}</small>
                            </div>
                          </div>
                        </td>

                        {/* Requested Role */}
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1">
                            {item.requestedRoleName || item.roleName || "Employee"}
                          </span>
                        </td>

                        {/* Contact Info */}
                        <td>
                          <small className="d-block text-dark fw-medium">{item.phone || "N/A"}</small>
                          <small className="text-muted">{item.country || "N/A"}</small>
                        </td>

                        {/* Registration Date */}
                        <td>
                          <small className="text-dark">
                            {new Date(item.registrationDate || item.createdAt || Date.now()).toLocaleDateString()}
                          </small>
                        </td>

                        {/* Status */}
                        <td>
                          {currentStatus === "approved" ? (
                            <span className="badge bg-success px-2 py-1">APPROVED</span>
                          ) : currentStatus === "rejected" || item.status === "suspended" ? (
                            <span className="badge bg-danger px-2 py-1">REJECTED</span>
                          ) : (
                            <span className="badge bg-warning text-dark px-2 py-1">PENDING</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="text-end pe-3">
                          <div className="btn-group btn-group-sm">
                            {/* View Applicant Details */}
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => setSelectedApplicant(item)}
                              title="View Full Profile & Uploaded Documents"
                            >
                              <i className="bi bi-eye-fill me-1"></i> View
                            </button>

                            {/* Approve Button (Super Admin Only) */}
                            {isSuperAdmin && currentStatus === "pending" && (
                              <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => handleApprove(item)}
                                disabled={isProcessing}
                              >
                                <i className="bi bi-check-lg me-1"></i> Approve
                              </button>
                            )}

                            {/* Reject Button (Super Admin Only) */}
                            {isSuperAdmin && currentStatus === "pending" && (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => {
                                  setRejectingApplicant(item);
                                  setRejectionReason("");
                                }}
                                disabled={isProcessing}
                              >
                                <i className="bi bi-x-lg me-1"></i> Reject
                              </button>
                            )}

                            {/* Delete Button (Super Admin Only) */}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(item._id, item.fullName)}
                                disabled={isProcessing}
                                title="Delete Registration Record"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* APPLICANT DETAILS MODAL */}
      {selectedApplicant && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-0">
              <div className="modal-header bg-light py-2">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-person-badge me-2"></i> Applicant Registration Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedApplicant(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  {/* Photo & Basic Summary */}
                  <div className="col-md-4 text-center border-end">
                    {selectedApplicant.profileImageUrl ? (
                      <img
                        src={selectedApplicant.profileImageUrl}
                        alt={selectedApplicant.fullName}
                        className="img-fluid rounded border mb-3"
                        style={{ maxHeight: "180px", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="bg-secondary text-white rounded d-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{ width: "120px", height: "120px", fontSize: "2rem" }}
                      >
                        {selectedApplicant.fullName ? selectedApplicant.fullName.substring(0, 2).toUpperCase() : "U"}
                      </div>
                    )}
                    <h5 className="fw-bold text-dark mb-1">{selectedApplicant.fullName}</h5>
                    <span className="badge bg-primary px-3 py-1 mb-2">
                      {selectedApplicant.requestedRoleName || selectedApplicant.roleName || "Employee"}
                    </span>
                    <small className="d-block text-muted">
                      Status: <strong>{(selectedApplicant.approvalStatus || selectedApplicant.status || "PENDING").toUpperCase()}</strong>
                    </small>
                  </div>

                  {/* Personal & Contact Details */}
                  <div className="col-md-8">
                    <h6 className="fw-bold border-bottom pb-2 text-dark">Applicant Profile Information</h6>
                    <div className="row g-2 small">
                      <div className="col-6">
                        <span className="text-muted">Corporate Email:</span>
                        <div className="fw-bold text-dark">{selectedApplicant.email}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Mobile Phone:</span>
                        <div className="fw-bold text-dark">{selectedApplicant.phone || "N/A"}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Country:</span>
                        <div className="fw-bold text-dark">{selectedApplicant.country || "N/A"}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Registration Date:</span>
                        <div className="fw-bold text-dark">
                          {new Date(selectedApplicant.registrationDate || selectedApplicant.createdAt || Date.now()).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Date of Birth:</span>
                        <div className="fw-bold text-dark">{selectedApplicant.dateOfBirth || "N/A"}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Place of Birth:</span>
                        <div className="fw-bold text-dark">{selectedApplicant.placeOfBirth || "N/A"}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Email Verified:</span>
                        <div className="fw-bold text-success">
                          {selectedApplicant.emailVerified ? "Verified (OTP)" : "Pending / Active"}
                        </div>
                      </div>
                      <div className="col-12 mt-2">
                        <span className="text-muted">Accommodation Address:</span>
                        <div className="fw-bold text-dark bg-light p-2 border mt-1" style={{ whiteSpace: "pre-wrap" }}>
                          {selectedApplicant.accommodationAddress || "N/A"}
                        </div>
                      </div>
                      {selectedApplicant.rejectedReason && (
                        <div className="col-12 mt-2">
                          <span className="text-danger fw-bold">Rejection Reason:</span>
                          <div className="p-2 bg-light border text-danger small">
                            {selectedApplicant.rejectedReason}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Uploaded Documents List */}
                    <h6 className="fw-bold border-bottom pb-2 text-dark mt-4">
                      Uploaded Verification & Compliance Documents ({selectedApplicant.uploadedDocumentsWithUrls?.length || 0})
                    </h6>
                    {(!selectedApplicant.uploadedDocumentsWithUrls || selectedApplicant.uploadedDocumentsWithUrls.length === 0) ? (
                      <div className="small text-muted italic">No verification documents uploaded.</div>
                    ) : (
                      <div className="list-group list-group-flush border">
                        {selectedApplicant.uploadedDocumentsWithUrls.map((doc: any, idx: number) => (
                          <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-2">
                            <div>
                              <i className="bi bi-file-earmark-pdf-fill text-danger me-2"></i>
                              <span className="small text-dark fw-bold">{doc.fileName || doc.title || `Document #${idx + 1}`}</span>
                              {doc.documentType && (
                                <span className="badge bg-secondary ms-2 text-uppercase">{doc.documentType.replace("_", " ")}</span>
                              )}
                            </div>
                            <div className="btn-group btn-group-sm">
                              {doc.fileUrl ? (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline-primary"
                                >
                                  Preview
                                </a>
                              ) : (
                                <button disabled className="btn btn-outline-secondary">Processing</button>
                              )}
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  download={doc.fileName || `${doc.title}.pdf`}
                                  className="btn btn-outline-secondary"
                                >
                                  Download
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2">
                {isSuperAdmin && (selectedApplicant.approvalStatus === "pending" || selectedApplicant.status === "inactive") && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success btn-sm fw-bold px-3"
                      onClick={() => handleApprove(selectedApplicant)}
                      disabled={isProcessing}
                    >
                      <i className="bi bi-check-circle me-1"></i> APPROVE REGISTRATION
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm fw-bold px-3"
                      onClick={() => {
                        setRejectingApplicant(selectedApplicant);
                        setSelectedApplicant(null);
                        setRejectionReason("");
                      }}
                      disabled={isProcessing}
                    >
                      <i className="bi bi-x-circle me-1"></i> REJECT
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedApplicant(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectingApplicant && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-0">
              <form onSubmit={handleRejectSubmit}>
                <div className="modal-header bg-danger text-white py-2">
                  <h5 className="modal-title fw-bold">Reject User Registration</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setRejectingApplicant(null)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <p className="small text-dark mb-3">
                    Are you sure you want to reject registration for <strong>{rejectingApplicant.fullName}</strong> ({rejectingApplicant.email})?
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">Reason for Rejection *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Invalid passport copy provided, phone number verification failed..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="submit" className="btn btn-danger btn-sm px-4 fw-bold" disabled={isProcessing}>
                    {isProcessing ? "REJECTING..." : "CONFIRM REJECTION"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRejectingApplicant(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
