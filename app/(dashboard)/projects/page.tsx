"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { ProjectModal } from "../../../src/features/projects/ProjectModal";
import { ProjectFormValues } from "../../../src/schemas/project";
import { useAuth } from "../../../src/hooks/useAuth";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Queries
  const projects = useQuery(api.projects.listProjects, {
    status: statusFilter || undefined,
  }) || [];

  const companies = useQuery(api.companies.listCompanies, {}) || [];
  const usersList = useQuery(api.users.listUsers, {}) || [];

  const createProjMut = useMutation(api.projects.createProject);

  const handleCreateSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      await createProjMut({
        companyId: values.companyId as any,
        name: values.name,
        code: values.code,
        projectManagerId: values.projectManagerId ? (values.projectManagerId as any) : undefined,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        status: values.status,
        budget: values.budget,
        description: values.description,
        actorId: user?._id as any,
      });
      setFeedback(`Project ${values.name} (${values.code}) created successfully.`);
    } catch (err: any) {
      alert(err.message || "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Enterprise Projects & Resource Tracking"
        subtitle="Manage client projects, project manager assignments, schedules, and budget allocations"
        breadcrumbs={[{ label: "Projects" }]}
        actions={
          <button
            type="button"
            className="btn btn-erp-danger btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-plus-square me-1"></i> CREATE PROJECT
          </button>
        }
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card card-erp mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-bold small mb-1">Filter by Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">-- All Statuses --</option>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card card-erp">
        <div className="card-header py-2">
          <i className="bi bi-diagram-3 me-2"></i>PROJECT DIRECTORY ({projects.length} Total)
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Project Code</th>
                  <th>Project Name</th>
                  <th>Company / Branch</th>
                  <th>Project Manager</th>
                  <th>Start Date</th>
                  <th>Budget ($)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? (
                  projects.map((p: any) => (
                    <tr key={p._id}>
                      <td><strong>{p.code}</strong></td>
                      <td>{p.name}</td>
                      <td>{p.companyName}</td>
                      <td>{p.projectManagerName}</td>
                      <td>{p.startDate}</td>
                      <td>{p.budget ? `$${p.budget.toLocaleString()}` : "--"}</td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === "active"
                              ? "bg-success"
                              : p.status === "completed"
                              ? "bg-primary"
                              : p.status === "on_hold"
                              ? "bg-danger"
                              : "bg-secondary"
                          } rounded-0 text-uppercase`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No project records found. Click "Create Project" to add a new project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSubmit}
        companies={companies}
        managers={usersList}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
