"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { useAuth } from "../../../src/hooks/useAuth";

export default function MyProjectsPage() {
  const { user } = useAuth();
  const projects = useQuery(api.projects.listProjects, {}) || [];

  return (
    <div>
      <EnterprisePageHeader
        title="My Assigned Enterprise Projects"
        subtitle="Review project assignments, client location, schedule deliverables, and project manager contacts"
        breadcrumbs={[{ label: "My Projects" }]}
      />

      <div className="row g-3">
        {projects.length > 0 ? (
          projects.map((p: any) => (
            <div key={p._id} className="col-lg-6">
              <div className="card card-erp h-100">
                <div className="card-header py-2 d-flex justify-content-between align-items-center">
                  <span className="fw-bold">
                    <i className="bi bi-diagram-3 me-2 text-primary"></i>
                    {p.name} ({p.code})
                  </span>
                  <span
                    className={`badge ${
                      p.status === "active"
                        ? "bg-success"
                        : p.status === "completed"
                        ? "bg-primary"
                        : "bg-secondary"
                    } rounded-0 text-uppercase`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="card-body p-3">
                  <div className="row g-2 small mb-3">
                    <div className="col-6">
                      <strong className="text-muted d-block">Corporate Employer:</strong>
                      <span className="text-dark fw-bold">{p.companyName}</span>
                    </div>

                    <div className="col-6">
                      <strong className="text-muted d-block">Project Manager:</strong>
                      <span className="text-dark">{p.projectManagerName}</span>
                    </div>

                    <div className="col-6">
                      <strong className="text-muted d-block">Working Period:</strong>
                      <span className="text-dark">
                        {p.startDate} to {p.endDate || "Ongoing"}
                      </span>
                    </div>

                    <div className="col-6">
                      <strong className="text-muted d-block">Allocated Budget:</strong>
                      <span className="text-dark">{p.budget ? `$${p.budget.toLocaleString()}` : "N/A"}</span>
                    </div>
                  </div>

                  {p.description && (
                    <div className="bg-light p-2 border small">
                      <strong className="text-muted d-block mb-1">Scope & Description:</strong>
                      <p className="mb-0 text-dark">{p.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="card card-erp p-5 text-center text-muted">
              <i className="bi bi-briefcase fs-1 text-secondary d-block mb-2"></i>
              No active project assignments found for your employee account.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
