"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../../src/components/layout/EnterprisePageHeader";
import { BootstrapModal } from "../../../../src/components/modal/BootstrapModal";
import { useAuth } from "../../../../src/hooks/useAuth";

export default function HolidaysPage() {
  const { user } = useAuth();
  const holidays = useQuery(api.holidays.listHolidays, {}) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const addHolidayMut = useMutation(api.holidays.addHoliday);
  const deleteHolidayMut = useMutation(api.holidays.deleteHoliday);

  const handleAdd = async () => {
    if (!name || !date || !user) {
      alert("Please fill in holiday title and date.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addHolidayMut({
        name,
        date,
        isMandatory,
        description: description || undefined,
        actorId: user._id as any,
      });
      setFeedback(`Statutory holiday '${name}' added.`);
      setName("");
      setDate("");
      setDescription("");
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to add holiday.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (h: any) => {
    if (!user) return;
    if (confirm(`Are you sure you want to remove statutory holiday '${h.name}'?`)) {
      try {
        await deleteHolidayMut({
          holidayId: h._id,
          actorId: user._id as any,
        });
        setFeedback(`Removed statutory holiday '${h.name}'.`);
      } catch (err: any) {
        alert(err.message || "Failed to delete holiday.");
      }
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Enterprise Statutory Holiday Calendar Manager"
        subtitle="Define corporate statutory holidays, mandatory paid non-working days, and leave calendar rules"
        breadcrumbs={[{ label: "Super Admin" }, { label: "Holidays" }]}
        actions={
          <button
            type="button"
            className="btn btn-erp-danger btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-calendar-plus me-1"></i> ADD STATUTORY HOLIDAY
          </button>
        }
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Holidays Table */}
      <div className="card card-erp">
        <div className="card-header py-2">
          <i className="bi bi-calendar-event me-2"></i>CONFIGURED STATUTORY HOLIDAYS ({holidays.length} Dates)
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Holiday Date</th>
                  <th>Holiday Title</th>
                  <th>Type / Status</th>
                  <th>Description / Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length > 0 ? (
                  holidays.map((h: any) => (
                    <tr key={h._id}>
                      <td>
                        <strong className="text-primary">{h.date}</strong>
                      </td>
                      <td>
                        <strong>{h.name}</strong>
                      </td>
                      <td>
                        {h.isMandatory ? (
                          <span className="badge bg-danger rounded-0">MANDATORY PAID HOLIDAY</span>
                        ) : (
                          <span className="badge bg-secondary rounded-0">OPTIONAL / LOCAL</span>
                        )}
                      </td>
                      <td>{h.description || "N/A"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-erp-danger btn-sm py-0 px-2"
                          onClick={() => handleDelete(h)}
                        >
                          <i className="bi bi-trash"></i> DELETE
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No statutory holidays configured in the corporate calendar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      <BootstrapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ADD STATUTORY CORPORATE HOLIDAY"
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
              onClick={handleAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? "ADDING..." : "ADD HOLIDAY"}
            </button>
          </div>
        }
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold small">Holiday Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. International Labor Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Holiday Date *</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="col-md-12">
            <div className="form-check form-switch mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="mandatorySwitch"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
              />
              <label className="form-check-label fw-bold small" htmlFor="mandatorySwitch">
                Mandatory Statutory Paid Holiday
              </label>
            </div>
          </div>

          <div className="col-md-12">
            <label className="form-label fw-bold small">Description / Notes</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Enter statutory policy notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
        </div>
      </BootstrapModal>
    </div>
  );
}
