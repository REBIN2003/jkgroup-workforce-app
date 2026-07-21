"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../../src/hooks/useAuth";

export default function ForbiddenPage() {
  const { user } = useAuth();

  return (
    <div className="container-fluid min-vh-100 bg-white d-flex flex-column justify-content-center align-items-center py-5">
      <div className="card card-erp shadow-sm text-center p-5" style={{ maxWidth: "560px", width: "100%" }}>
        <div className="mb-3 text-danger" style={{ fontSize: "3.5rem" }}>
          <i className="bi bi-shield-lock-fill"></i>
        </div>
        <h3 className="fw-bold text-dark mb-2">403 - ACCESS DENIED</h3>
        <p className="text-muted mb-4">
          You do not have the required RBAC permissions to access this enterprise module or perform this operation.
        </p>

        {user && (
          <div className="bg-light p-3 border mb-4 text-start small">
            <div><strong>Active Account:</strong> {user.fullName} ({user.email})</div>
            <div><strong>Assigned Role:</strong> <span className="badge bg-secondary">{user.roleName}</span></div>
            <div><strong>Employee ID:</strong> {user.employeeId}</div>
          </div>
        )}

        <div className="d-flex justify-content-center gap-2">
          <Link href="/dashboard" className="btn btn-erp-primary">
            <i className="bi bi-speedometer2 me-1"></i> Return to Main Dashboard
          </Link>
          <Link href="/login" className="btn btn-outline-secondary">
            <i className="bi bi-box-arrow-right me-1"></i> Switch User Account
          </Link>
        </div>
      </div>
    </div>
  );
}
