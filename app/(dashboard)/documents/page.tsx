"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { useAuth } from "../../../src/hooks/useAuth";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";

const DownloadContractButton = dynamic(
  () => import("../../../src/components/pdf/EmploymentContractPdf").then((mod) => mod.DownloadContractButton),
  { ssr: false }
);
import { BootstrapModal } from "../../../src/components/modal/BootstrapModal";

export default function DocumentsPage() {
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<
    "contract" | "passport" | "driving_license" | "visa" | "certificate" | "id_proof" | "report" | "other"
  >("passport");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [replaceDoc, setReplaceDoc] = useState<any | null>(null);

  // Selection states
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Queries & Mutations
  const docs = useQuery(api.documents.listDocuments, {
    loggedInUserId: user?._id,
    companyId: user?.companyId,
    roleName: user?.roleName,
    documentType: activeCategory || undefined,
  }) || [];

  // Clear selection if category or docs changes
  useEffect(() => {
    setSelectedDocIds(new Set());
  }, [activeCategory, docs.length]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = docs.map((d: any) => d._id);
      setSelectedDocIds(new Set(allIds));
    } else {
      setSelectedDocIds(new Set());
    }
  };

  const handleSelectDoc = (docId: string, checked: boolean) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(docId);
      } else {
        next.delete(docId);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedDocIds.size === 0) return;
    const confirmMsg = `Are you sure you want to delete the ${selectedDocIds.size} selected document(s)? This action cannot be undone.`;
    if (confirm(confirmMsg)) {
      setIsDeletingBulk(true);
      try {
        const deletePromises = Array.from(selectedDocIds).map((docId) =>
          deleteDocMut({
            documentId: docId as any,
            actorId: user?._id as any,
          })
        );
        await Promise.all(deletePromises);
        setFeedback(`Successfully deleted ${selectedDocIds.size} document(s).`);
        setSelectedDocIds(new Set());
      } catch (err: any) {
        alert(err.message || "Failed to delete selected documents.");
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };


  const generateUploadUrlMut = useMutation(api.documents.generateUploadUrl);
  const createDocMut = useMutation(api.documents.createDocument);
  const replaceDocMut = useMutation(api.documents.replaceDocumentFile);
  const deleteDocMut = useMutation(api.documents.deleteDocument);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        if (!title) {
          setTitle(acceptedFiles[0].name);
        }
      }
    },
  });

  const handleUpload = async () => {
    if (!selectedFile || !title || !user) {
      alert("Please specify a document title and select a file.");
      return;
    }
    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrlMut();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      const { storageId } = await res.json();

      const payload = {
        userId: user._id as any,
        companyId: user.companyId || undefined,
        title,
        documentType: docType,
        storageId: storageId as any,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        expiryDate: expiryDate || undefined,
        uploadedBy: user._id as any,
      };

      const insertedDocId = await createDocMut(payload);

      setFeedback(`Document '${title}' uploaded successfully.`);
      setTitle("");
      setExpiryDate("");
      setSelectedFile(null);
      setIsUploadModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplaceSubmit = async () => {
    if (!selectedFile || !replaceDoc || !user) {
      alert("Select a new replacement file first.");
      return;
    }
    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrlMut();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      const { storageId } = await res.json();

      await replaceDocMut({
        documentId: replaceDoc._id,
        storageId: storageId as any,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        actorId: user._id as any,
      });

      setFeedback(`Replaced file for document '${replaceDoc.title}'.`);
      setSelectedFile(null);
      setReplaceDoc(null);
    } catch (err: any) {
      alert(err.message || "Replace failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: any) => {
    if (!user) return;
    if (confirm(`Are you sure you want to delete '${doc.title}'?`)) {
      try {
        await deleteDocMut({
          documentId: doc._id,
          actorId: user._id as any,
        });
        setFeedback(`Deleted document '${doc.title}'.`);
      } catch (err: any) {
        alert(err.message || "Delete failed.");
      }
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Enterprise Personal & Corporate Document Vault"
        subtitle="Secure storage for passports, driving licenses, visas, certificates, and employment contracts"
        breadcrumbs={[{ label: "Document Vault" }]}
        actions={
          <div className="d-flex gap-2">
            {user && (
              <DownloadContractButton
                employeeName={user.fullName}
                employeeId={user.employeeId}
                roleName={user.roleName}
                companyName="JK Group International"
                issueDate={new Date().toLocaleDateString()}
              />
            )}

            <button
              type="button"
              className="btn btn-erp-danger btn-sm"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <i className="bi bi-cloud-upload me-1"></i> UPLOAD DOCUMENT
            </button>
          </div>
        }
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Category Tabs */}
      <div className="card card-erp mb-3">
        <div className="card-header py-2 bg-light border-bottom">
          <ul className="nav nav-tabs card-header-tabs rounded-0">
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeCategory === "" ? "active fw-bold" : "text-secondary"}`}
                onClick={() => setActiveCategory("")}
              >
                All Vault Documents
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeCategory === "passport" ? "active fw-bold text-primary" : "text-secondary"}`}
                onClick={() => setActiveCategory("passport")}
              >
                <i className="bi bi-journal-bookmark me-1"></i> Passports
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeCategory === "driving_license" ? "active fw-bold text-primary" : "text-secondary"}`}
                onClick={() => setActiveCategory("driving_license")}
              >
                <i className="bi bi-card-heading me-1"></i> Driving Licenses
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeCategory === "visa" ? "active fw-bold text-primary" : "text-secondary"}`}
                onClick={() => setActiveCategory("visa")}
              >
                <i className="bi bi-globe me-1"></i> Visas & Permits
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeCategory === "certificate" ? "active fw-bold text-primary" : "text-secondary"}`}
                onClick={() => setActiveCategory("certificate")}
              >
                <i className="bi bi-patch-check me-1"></i> Certificates
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeCategory === "contract" ? "active fw-bold text-primary" : "text-secondary"}`}
                onClick={() => setActiveCategory("contract")}
              >
                <i className="bi bi-file-earmark-text me-1"></i> Contracts
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-0">
          {/* Bulk actions bar */}
          {selectedDocIds.size > 0 && (
            <div className="d-flex align-items-center justify-content-between p-2 px-3 bg-light border-bottom border-danger">
              <span className="text-danger fw-bold small">
                <i className="bi bi-check2-square me-2"></i>
                {selectedDocIds.size} document(s) selected
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-danger btn-sm rounded-0 py-1"
                  onClick={handleBulkDelete}
                  disabled={isDeletingBulk}
                >
                  {isDeletingBulk ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      DELETING...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-1"></i> DELETE SELECTED
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-0 py-1"
                  onClick={() => setSelectedDocIds(new Set())}
                  disabled={isDeletingBulk}
                >
                  CLEAR
                </button>
              </div>
            </div>
          )}

          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: "40px" }} className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={docs.length > 0 && selectedDocIds.size === docs.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Document Title</th>
                  <th>Category</th>
                  <th>Owner / Emp ID</th>
                  <th>Expiration Date</th>
                  <th>File Size</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.length > 0 ? (
                  docs.map((d: any) => (
                    <tr key={d._id}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedDocIds.has(d._id)}
                          onChange={(e) => handleSelectDoc(d._id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <i className="bi bi-file-earmark me-2 text-primary"></i>
                        <strong>{d.title}</strong>
                      </td>
                      <td>
                        <span className="badge bg-secondary rounded-0 text-uppercase">
                          {d.documentType ? d.documentType.replace("_", " ") : "other"}
                        </span>
                      </td>
                      <td>{d.userName} ({d.employeeId})</td>
                      <td>
                        {d.expiryDate ? (
                          <span className="badge bg-warning text-dark rounded-0">{d.expiryDate}</span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>{d.fileSize ? (d.fileSize / 1024).toFixed(1) + " KB" : "N/A"}</td>
                      <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-erp-primary btn-sm py-0 px-2"
                            onClick={() => setPreviewDoc(d)}
                            title="Preview Document"
                          >
                            <i className="bi bi-eye"></i> PREVIEW
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm py-0 px-2 rounded-0"
                            onClick={() => {
                              setSelectedFile(null);
                              setReplaceDoc(d);
                            }}
                            title="Replace File"
                          >
                            <i className="bi bi-arrow-repeat"></i> REPLACE
                          </button>

                          <button
                            type="button"
                            className="btn btn-erp-danger btn-sm py-0 px-2"
                            onClick={() => handleDelete(d)}
                            title="Delete Document"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No document records found under this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <BootstrapModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="UPLOAD PERSONAL / CORPORATE DOCUMENT"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-erp-secondary btn-sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              CANCEL
            </button>
            <button
              type="button"
              className="btn btn-erp-danger btn-sm"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "UPLOADING..." : "UPLOAD FILE"}
            </button>
          </div>
        }
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold small">Document Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Passport Renewal 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small">Document Category *</label>
            <select
              className="form-select"
              value={docType}
              onChange={(e: any) => setDocType(e.target.value)}
            >
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
              <option value="visa">Visa / Work Permit</option>
              <option value="certificate">Educational / Skill Certificate</option>
              <option value="contract">Employment Contract</option>
              <option value="id_proof">Government ID Proof</option>
              <option value="other">Other Document</option>
            </select>
          </div>

          <div className="col-md-12">
            <label className="form-label fw-bold small">Document Expiry Date (Optional)</label>
            <input
              type="date"
              className="form-control"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="col-md-12">
            <label className="form-label fw-bold small">Select File * (PDF or Image)</label>
            <div
              {...getRootProps()}
              className={`border p-4 text-center bg-light ${isDragActive ? "border-primary" : "border-secondary"}`}
              style={{ cursor: "pointer", borderStyle: "dashed" }}
            >
              <input {...getInputProps()} />
              <i className="bi bi-cloud-arrow-up fs-2 text-secondary d-block mb-1"></i>
              {selectedFile ? (
                <span className="text-success fw-bold small">
                  <i className="bi bi-check-circle me-1"></i> {selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              ) : (
                <span className="small text-muted">
                  Drag & drop document file here, or click to browse (PDF, PNG, JPG)
                </span>
              )}
            </div>
          </div>
        </div>
      </BootstrapModal>

      {/* Document Preview Modal */}
      {previewDoc && (
        <BootstrapModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={`PREVIEW DOCUMENT: ${previewDoc.title}`}
          size="lg"
          footer={
            <div className="d-flex justify-content-between w-100">
              <a
                href={previewDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-erp-primary btn-sm"
              >
                <i className="bi bi-download me-1"></i> DOWNLOAD ORIGINAL
              </a>
              <button
                type="button"
                className="btn btn-erp-secondary btn-sm"
                onClick={() => setPreviewDoc(null)}
              >
                CLOSE PREVIEW
              </button>
            </div>
          }
        >
          <div className="text-center p-2">
            {previewDoc.fileType?.includes("image") ? (
              <img
                src={previewDoc.fileUrl}
                alt="Document Preview"
                className="img-fluid border"
                style={{ maxHeight: "480px" }}
              />
            ) : previewDoc.fileType?.includes("pdf") ? (
              <iframe
                src={previewDoc.fileUrl}
                title="PDF Preview"
                style={{ width: "100%", height: "500px", border: "1px solid #ccc" }}
              ></iframe>
            ) : (
              <div className="py-5">
                <i className="bi bi-file-earmark-arrow-down fs-1 text-primary d-block mb-2"></i>
                <p className="text-dark fw-bold mb-1">File Preview Not Directly Renderable</p>
                <p className="text-muted small">Click Download Original to view this document.</p>
              </div>
            )}
          </div>
        </BootstrapModal>
      )}

      {/* Document Replace Modal */}
      {replaceDoc && (
        <BootstrapModal
          isOpen={Boolean(replaceDoc)}
          onClose={() => setReplaceDoc(null)}
          title={`REPLACE FILE FOR: ${replaceDoc.title}`}
          footer={
            <div className="d-flex justify-content-end gap-2 w-100">
              <button
                type="button"
                className="btn btn-erp-secondary btn-sm"
                onClick={() => setReplaceDoc(null)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="btn btn-erp-danger btn-sm"
                onClick={handleReplaceSubmit}
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "REPLACING..." : "CONFIRM REPLACE"}
              </button>
            </div>
          }
        >
          <div className="mb-3">
            <p className="small text-muted mb-2">
              Select a new file to overwrite the current attachment for <strong>{replaceDoc.title}</strong>.
            </p>
            <div
              {...getRootProps()}
              className="border p-4 text-center bg-light"
              style={{ cursor: "pointer", borderStyle: "dashed" }}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <span className="text-success fw-bold small">
                  <i className="bi bi-check-circle me-1"></i> New Replacement File: {selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              ) : (
                <span className="small text-muted">Click or drag new replacement file here</span>
              )}
            </div>
          </div>
        </BootstrapModal>
      )}
    </div>
  );
}
