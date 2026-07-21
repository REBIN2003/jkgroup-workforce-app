"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../../src/components/layout/EnterprisePageHeader";
import { PERMISSIONS } from "../../../../src/constants/rbac";
import { BootstrapModal } from "../../../../src/components/modal/BootstrapModal";
import { useAuth } from "../../../../src/hooks/useAuth";

export default function RolesMatrixPage() {
  const { user } = useAuth();
  const roles = useQuery(api.roles.listRolesWithPermissions, {}) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const createRoleMut = useMutation(api.roles.createCustomRole);
  const togglePermMut = useMutation(api.roles.toggleRolePermission);

  const allPermissionCodes = Object.values(PERMISSIONS);

  const handleToggle = async (roleId: string, code: string) => {
    if (!user) return;
    try {
      await togglePermMut({
        roleId: roleId as any,
        permissionCode: code,
        actorId: user._id as any,
      });
      setFeedback(`Toggled permission '${code}' in real-time.`);
    } catch (err: any) {
      alert(err.message || "Failed to toggle permission.");
    }
  };

  const handleCreateRole = async () => {
    if (!roleName || !user) {
      alert("Enter a custom role name.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createRoleMut({
        name: roleName,
        description: roleDesc || "Custom enterprise role",
        actorId: user._id as any,
      });
      setFeedback(`Custom role '${roleName}' created successfully.`);
      setRoleName("");
      setRoleDesc("");
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Role creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Dynamic RBAC Role Creation & Permission Matrix Editor"
        subtitle="Create custom enterprise roles and dynamically configure module permissions across all system roles"
        breadcrumbs={[{ label: "Super Admin" }, { label: "Role Matrix" }]}
        actions={
          <button
            type="button"
            className="btn btn-erp-danger btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-shield-plus me-1"></i> CREATE CUSTOM ROLE
          </button>
        }
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Permission Matrix Grid Card */}
      <div className="card card-erp">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <span><i className="bi bi-grid-3x3-gap me-2"></i>REAL-TIME PERMISSION MATRIX ({roles.length} System Roles)</span>
          <span className="badge bg-danger">SUPER ADMIN ACCESS</span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: "320px" }}>Permission Code / Function</th>
                  {roles.map((r: any) => (
                    <th key={r._id} className="text-center">
                      <span className="d-block">{r.name}</span>
                      {r.isSystem && (
                        <span className="badge bg-secondary rounded-0" style={{ fontSize: "9px" }}>SYSTEM</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPermissionCodes.map((code) => (
                  <tr key={code}>
                    <td>
                      <code className="text-primary fw-bold">{code}</code>
                    </td>
                    {roles.map((r: any) => {
                      const isGranted = r.permissions.includes(code);
                      return (
                        <td key={r._id} className="text-center">
                          <div className="form-check form-switch d-inline-block mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => handleToggle(r._id, code)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Custom Role Modal */}
      <BootstrapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="CREATE CUSTOM ENTERPRISE RBAC ROLE"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-erp-secondary btn-sm"
              onClick={() => setIsModalOpen(false)}
            >
              CANCEL
            </button>
            <button
              type="button"
              className="btn btn-erp-danger btn-sm"
              onClick={handleCreateRole}
              disabled={isSubmitting}
            >
              {isSubmitting ? "CREATING..." : "CREATE ROLE"}
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label className="form-label fw-bold small">Role Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Regional Site Inspector"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold small">Role Description</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Describe role scope and operational privileges..."
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value)}
          ></textarea>
        </div>
      </BootstrapModal>
    </div>
  );
}
