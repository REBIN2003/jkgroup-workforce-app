"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BootstrapModal } from "../../components/modal/BootstrapModal";
import { leaveFormSchema, LeaveFormValues } from "../../schemas/leave";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LeaveFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function LeaveRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: LeaveRequestModalProps) {
  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveType: "annual",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reason: "",
    },
  });

  const handleFormSubmit = async (values: LeaveFormValues) => {
    await onSubmit(values);
    form.reset();
    onClose();
  };

  return (
    <BootstrapModal
      isOpen={isOpen}
      onClose={onClose}
      title="SUBMIT ENTERPRISE LEAVE REQUEST"
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
            {isSubmitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
          </button>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="row g-3">
          <div className="col-md-12">
            <label className="form-label fw-bold small">Leave Type *</label>
            <select className="form-select" {...form.register("leaveType")}>
              <option value="annual">Annual Paid Leave</option>
              <option value="sick">Medical / Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="col-md-6">
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

          <div className="col-md-6">
            <label className="form-label fw-bold small">End Date *</label>
            <input
              type="date"
              className={`form-control ${form.formState.errors.endDate ? "is-invalid" : ""}`}
              {...form.register("endDate")}
            />
            {form.formState.errors.endDate && (
              <div className="invalid-feedback">{form.formState.errors.endDate.message}</div>
            )}
          </div>

          <div className="col-md-12">
            <label className="form-label fw-bold small">Reason / Description *</label>
            <textarea
              className={`form-control ${form.formState.errors.reason ? "is-invalid" : ""}`}
              rows={3}
              placeholder="State clear reasons for your leave application..."
              {...form.register("reason")}
            ></textarea>
            {form.formState.errors.reason && (
              <div className="invalid-feedback">{form.formState.errors.reason.message}</div>
            )}
          </div>
        </div>
      </form>
    </BootstrapModal>
  );
}
