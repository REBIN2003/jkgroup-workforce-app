"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BootstrapModal } from "../../components/modal/BootstrapModal";
import { projectFormSchema, ProjectFormValues } from "../../schemas/project";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  companies: Array<{ _id: string; name: string }>;
  managers: Array<{ _id: string; fullName: string }>;
  isSubmitting: boolean;
}

export function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  companies,
  managers,
  isSubmitting,
}: ProjectModalProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      companyId: companies[0]?._id || "",
      name: "",
      code: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      projectManagerId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      status: "active",
      budget: 50000,
      description: "",
    },
  });

  const handleFormSubmit = async (values: ProjectFormValues) => {
    await onSubmit(values);
    form.reset();
    onClose();
  };

  return (
    <BootstrapModal
      isOpen={isOpen}
      onClose={onClose}
      title="CREATE ENTERPRISE PROJECT"
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button type="button" className="btn btn-erp-secondary btn-sm" onClick={onClose}>
            CANCEL
          </button>
          <button
            type="button"
            className="btn btn-erp-danger btn-sm"
            onClick={form.handleSubmit(handleFormSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "SAVING..." : "CREATE PROJECT"}
          </button>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold small">Assign Company / Branch *</label>
            <select
              className={`form-select ${form.formState.errors.companyId ? "is-invalid" : ""}`}
              {...form.register("companyId")}
            >
              <option value="">-- Select Company --</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {form.formState.errors.companyId && (
              <div className="invalid-feedback">{form.formState.errors.companyId.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Project Name *</label>
            <input
              type="text"
              className={`form-control ${form.formState.errors.name ? "is-invalid" : ""}`}
              placeholder="e.g. ERP System Migration Phase 1"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <div className="invalid-feedback">{form.formState.errors.name.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Project Code *</label>
            <input
              type="text"
              className={`form-control ${form.formState.errors.code ? "is-invalid" : ""}`}
              placeholder="PRJ-2026-A"
              {...form.register("code")}
            />
            {form.formState.errors.code && (
              <div className="invalid-feedback">{form.formState.errors.code.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Assigned Project Manager</label>
            <select className="form-select" {...form.register("projectManagerId")}>
              <option value="">-- Unassigned --</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label fw-bold small">Start Date *</label>
            <input
              type="date"
              className={`form-control ${form.formState.errors.startDate ? "is-invalid" : ""}`}
              {...form.register("startDate")}
            />
            {form.formState.errors.startDate && (
              <div className="invalid-feedback">{form.formState.errors.startDate.message}</div>
            )}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-bold small">End Date (Optional)</label>
            <input type="date" className="form-control" {...form.register("endDate")} />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-bold small">Initial Status *</label>
            <select className="form-select" {...form.register("status")}>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Allocated Budget ($ USD)</label>
            <input
              type="number"
              className="form-control"
              placeholder="50000"
              {...form.register("budget", { valueAsNumber: true })}
            />
          </div>

          <div className="col-md-12">
            <label className="form-label fw-bold small">Project Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Enter brief project scope and deliverables..."
              {...form.register("description")}
            ></textarea>
          </div>
        </div>
      </form>
    </BootstrapModal>
  );
}
