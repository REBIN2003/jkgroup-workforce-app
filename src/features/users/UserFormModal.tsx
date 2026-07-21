"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BootstrapModal } from "../../components/modal/BootstrapModal";
import { userFormSchema, UserFormValues } from "../../schemas/user";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  roles: Array<{ _id: string; name: string }>;
  initialData?: UserFormValues | null;
  isSubmitting: boolean;
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  roles,
  initialData,
  isSubmitting,
}: UserFormModalProps) {
  const isEditing = Boolean(initialData);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      fullName: "",
      employeeId: "",
      roleId: "",
      companyId: "",
      phone: "",
      password: "User@123",
      status: "active",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        email: "",
        fullName: "",
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        roleId: roles.find((r) => r.name === "Employee")?._id || roles[0]?._id || "",
        companyId: "",
        phone: "",
        password: "User@123",
        status: "active",
      });
    }
  }, [initialData, isOpen, roles, form]);

  const handleFormSubmit = async (values: UserFormValues) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <BootstrapModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "EDIT EMPLOYEE RECORD" : "CREATE NEW EMPLOYEE ACCOUNT"}
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
            {isSubmitting ? "SAVING..." : isEditing ? "UPDATE EMPLOYEE" : "CREATE EMPLOYEE"}
          </button>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold small">Full Name *</label>
            <input
              type="text"
              className={`form-control ${form.formState.errors.fullName ? "is-invalid" : ""}`}
              placeholder="e.g. Sarah Jenkins"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <div className="invalid-feedback">{form.formState.errors.fullName.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Corporate Email *</label>
            <input
              type="email"
              className={`form-control ${form.formState.errors.email ? "is-invalid" : ""}`}
              placeholder="sarah@company.com"
              disabled={isEditing}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <div className="invalid-feedback">{form.formState.errors.email.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Employee ID *</label>
            <input
              type="text"
              className={`form-control ${form.formState.errors.employeeId ? "is-invalid" : ""}`}
              placeholder="EMP-1002"
              disabled={isEditing}
              {...form.register("employeeId")}
            />
            {form.formState.errors.employeeId && (
              <div className="invalid-feedback">{form.formState.errors.employeeId.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Phone Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="+1-555-0199"
              {...form.register("phone")}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Assigned RBAC Role *</label>
            <select
              className={`form-select ${form.formState.errors.roleId ? "is-invalid" : ""}`}
              {...form.register("roleId")}
            >
              <option value="">-- Select Role --</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
            {form.formState.errors.roleId && (
              <div className="invalid-feedback">{form.formState.errors.roleId.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Account Status *</label>
            <select className="form-select" {...form.register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {!isEditing && (
            <div className="col-md-12">
              <label className="form-label fw-bold small">Initial Password *</label>
              <input
                type="password"
                className={`form-control ${form.formState.errors.password ? "is-invalid" : ""}`}
                placeholder="User@123"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <div className="invalid-feedback">{form.formState.errors.password.message}</div>
              )}
              <small className="text-muted">Default temp password: User@123</small>
            </div>
          )}
        </div>
      </form>
    </BootstrapModal>
  );
}
