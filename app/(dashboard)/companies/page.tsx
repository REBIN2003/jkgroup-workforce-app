"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { BootstrapModal } from "../../../src/components/modal/BootstrapModal";

export default function CompaniesPage() {
  const companies = useQuery(api.companies.listCompanies, {}) || [];
  const createCompanyMut = useMutation(api.companies.createCompany);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name || !code) {
      alert("Name and Company Code are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createCompanyMut({
        name,
        code,
        taxId: taxId || undefined,
        email: email || undefined,
      });
      setFeedback(`Company ${name} (${code}) added successfully.`);
      setName("");
      setCode("");
      setTaxId("");
      setEmail("");
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to add company.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Enterprise Companies & Organization Structure"
        subtitle="Manage corporate entities, parent organization structure, and branch office locations"
        breadcrumbs={[{ label: "Companies" }]}
        actions={
          <button
            type="button"
            className="btn btn-erp-danger btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-building-add me-1"></i> ADD NEW COMPANY
          </button>
        }
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Directory Table */}
      <div className="card card-erp">
        <div className="card-header py-2">
          <i className="bi bi-building me-2"></i>ENTERPRISE CORPORATE ENTITIES ({companies.length} Total)
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Company Code</th>
                  <th>Legal Entity Name</th>
                  <th>Tax Registration ID</th>
                  <th>Corporate Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companies.length > 0 ? (
                  companies.map((c: any) => (
                    <tr key={c._id}>
                      <td><strong>{c.code}</strong></td>
                      <td>{c.name}</td>
                      <td>{c.taxId || "N/A"}</td>
                      <td>{c.email || "N/A"}</td>
                      <td>
                        <span className="badge bg-success rounded-0">{c.status.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No companies configured yet. Click "Add New Company" to seed organization profile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <BootstrapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ADD ENTERPRISE COMPANY ENTITY"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button type="button" className="btn btn-erp-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
              CANCEL
            </button>
            <button
              type="button"
              className="btn btn-erp-danger btn-sm"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "SAVING..." : "SAVE COMPANY"}
            </button>
          </div>
        }
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold small">Company Code *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. JK-HQ"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small">Company Legal Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. JK Group International LLC"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small">Tax Registration ID / EIN</label>
            <input
              type="text"
              className="form-control"
              placeholder="TAX-998822"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small">Corporate Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="info@jkgroup.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      </BootstrapModal>
    </div>
  );
}
