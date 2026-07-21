"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../../src/components/layout/EnterprisePageHeader";
import { useAuth } from "../../../../src/hooks/useAuth";

export default function SessionsPage() {
  const { user } = useAuth();
  const sessions = useQuery(api.sessions.listActiveSessions, {}) || [];
  const [feedback, setFeedback] = useState<string | null>(null);

  const revokeMut = useMutation(api.sessions.revokeSession);

  const handleRevoke = async (s: any) => {
    if (!user) return;
    if (confirm(`Force revoke active session for employee '${s.userName}' (${s.employeeId})?`)) {
      try {
        await revokeMut({
          sessionId: s._id,
          actorId: user._id as any,
        });
        setFeedback(`Session token for '${s.userName}' revoked.`);
      } catch (err: any) {
        alert(err.message || "Failed to revoke session.");
      }
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Active User Sessions & Security Login Monitor"
        subtitle="Monitor active session tokens, IP address origins, device user agents, and perform emergency session revocations"
        breadcrumbs={[{ label: "Super Admin" }, { label: "Active Sessions" }]}
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Sessions Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">TOTAL ACTIVE SESSIONS</span>
            <div className="fs-3 fw-bold text-success">{sessions.length}</div>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">AUTHENTICATED USERS</span>
            <div className="fs-3 fw-bold text-primary">
              {new Set(sessions.map((s: any) => s.userId)).size}
            </div>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">EXPIRED TOKENS</span>
            <div className="fs-3 fw-bold text-secondary">
              {sessions.filter((s: any) => s.isExpired).length}
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Table */}
      <div className="card card-erp">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <span><i className="bi bi-laptop me-2"></i>ACTIVE USER SESSIONS MONITOR</span>
          <span className="badge bg-danger">REAL-TIME CONVEX STORE</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Employee Name / Email</th>
                  <th>Role</th>
                  <th>Session Token snippet</th>
                  <th>IP Address / Device</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length > 0 ? (
                  sessions.map((s: any) => (
                    <tr key={s._id}>
                      <td><strong>{s.employeeId}</strong></td>
                      <td>
                        <strong className="text-dark d-block">{s.userName}</strong>
                        <small className="text-muted">{s.userEmail}</small>
                      </td>
                      <td><span className="badge bg-secondary rounded-0">{s.roleName}</span></td>
                      <td><code className="text-primary">{s.sessionToken.substring(0, 16)}...</code></td>
                      <td>
                        <span className="d-block small text-dark">{s.ipAddress || "127.0.0.1"}</span>
                        <small className="text-muted text-truncate d-block" style={{ maxWidth: "200px" }}>
                          {s.userAgent || "Desktop App"}
                        </small>
                      </td>
                      <td>{new Date(s.createdAt).toLocaleString()}</td>
                      <td>
                        {s.isExpired ? (
                          <span className="badge bg-secondary rounded-0">EXPIRED</span>
                        ) : (
                          <span className="badge bg-success rounded-0">ACTIVE SESSION</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-erp-danger btn-sm py-0 px-2"
                          onClick={() => handleRevoke(s)}
                        >
                          <i className="bi bi-power me-1"></i> REVOKE
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No active sessions found in session store.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
