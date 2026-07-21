"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";

export default function AuditLogsPage() {
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const logs = useQuery(api.audit.listAuditLogs, {
    module: moduleFilter || undefined,
  }) || [];

  return (
    <div>
      <EnterprisePageHeader
        title="Enterprise Security Audit Trail & Activity Log"
        subtitle="Real-time compliance monitoring, user authentication logs, and data modification events"
        breadcrumbs={[{ label: "Audit Logs" }]}
      />

      {/* Filter Toolbar */}
      <div className="card card-erp mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-bold small mb-1">Filter by System Module</label>
              <select
                className="form-select"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="">-- All System Modules --</option>
                <option value="AUTH">Authentication (AUTH)</option>
                <option value="USERS">User Management (USERS)</option>
                <option value="ATTENDANCE">Attendance (ATTENDANCE)</option>
                <option value="LEAVE">Leave Requests (LEAVE)</option>
                <option value="PROJECTS">Projects (PROJECTS)</option>
                <option value="DOCUMENTS">Documents (DOCUMENTS)</option>
                <option value="SETTINGS">Settings (SETTINGS)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card card-erp">
        <div className="card-header py-2">
          <i className="bi bi-shield-check me-2"></i>SECURITY AUDIT TRAIL ({logs.length} Log Entries)
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Module</th>
                  <th>Action Code</th>
                  <th>Actor / Account</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((l: any) => (
                    <tr key={l._id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <small className="text-muted">
                          {new Date(l.timestamp).toLocaleString()}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-dark rounded-0">{l.module}</span>
                      </td>
                      <td>
                        <strong className="text-primary">{l.action}</strong>
                      </td>
                      <td>{l.actorName}</td>
                      <td style={{ maxWidth: "320px" }}>{l.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No security audit log records found.
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
