"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { Id } from "../../../convex/_generated/dataModel";

interface EmployeeDocumentsSectionProps {
  userId: Id<"users">;
  isEditable?: boolean;
}

export function EmployeeDocumentsSection({ userId, isEditable = true }: EmployeeDocumentsSectionProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "Super Admin";
  const canModify = isEditable || isSuperAdmin;

  // Search & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Upload States
  const [customTitle, setCustomTitle] = useState("");
  const [selectedPdfFiles, setSelectedPdfFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Replace Document State
  const [replacingDoc, setReplacingDoc] = useState<any | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);

  // Convex Queries & Mutations (Using Deployed Public Functions)
  const rawDocuments =
    useQuery(api.documents.listDocuments, {
      userId,
      loggedInUserId: user?._id,
      companyId: user?.companyId,
      roleName: user?.roleName,
    }) || [];

  const generateUploadUrlMut = useMutation(api.documents.generateUploadUrl);
  const createDocumentMut = useMutation(api.documents.createDocument);
  const replaceDocumentMut = useMutation(api.documents.replaceDocumentFile);
  const deleteDocumentMut = useMutation(api.documents.deleteDocument);

  // Client-Side Search & Sort Filter
  let documents = rawDocuments.filter((d: any) => d.userId === userId);

  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase().trim();
    documents = documents.filter(
      (d: any) =>
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.fileName && d.fileName.toLowerCase().includes(q))
    );
  }

  if (sortOrder === "oldest") {
    documents.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
  } else {
    documents.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  // MAX FILE SIZE: 10 MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Handle PDF Selection & Validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    if (!e.target.files) return;

    const filesArr = Array.from(e.target.files);
    const validPdfs: File[] = [];

    for (const f of filesArr) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        setUploadError(`Invalid file format: '${f.name}'. Only PDF documents (.pdf) are allowed.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setUploadError(`File too large: '${f.name}' exceeds the 10 MB maximum limit.`);
        return;
      }
      validPdfs.push(f);
    }

    setSelectedPdfFiles(validPdfs);
  };

  // Upload PDF Files
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPdfFiles.length === 0 || !user) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Resolve company ID
      const targetCompanyId = user.companyId || undefined;

      let uploadedCount = 0;
      for (const file of selectedPdfFiles) {
        const uploadUrl = await generateUploadUrlMut();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name} to storage.`);
        }

        const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };

        const docTitle =
          customTitle.trim() !== ""
            ? selectedPdfFiles.length === 1
              ? customTitle.trim()
              : `${customTitle.trim()} - ${file.name}`
            : file.name.replace(/\.[^/.]+$/, "");

        await createDocumentMut({
          userId: userId,
          companyId: targetCompanyId,
          title: docTitle,
          documentType: "other",
          storageId: storageId,
          fileSize: file.size,
          fileType: "application/pdf",
          uploadedBy: user._id,
        });

        uploadedCount++;
      }

      setUploadSuccess(`Successfully uploaded ${uploadedCount} PDF document(s).`);
      setSelectedPdfFiles([]);
      setCustomTitle("");
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload PDF document.");
    } finally {
      setIsUploading(false);
    }
  };

  // Replace Document Submission
  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingDoc || !replaceFile || !user) return;

    if (replaceFile.type !== "application/pdf" && !replaceFile.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files (.pdf) are supported for document replacement.");
      return;
    }
    if (replaceFile.size > MAX_FILE_SIZE) {
      setUploadError("File exceeds 10 MB maximum limit.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadUrl = await generateUploadUrlMut();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": replaceFile.type },
        body: replaceFile,
      });
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };

      await replaceDocumentMut({
        documentId: replacingDoc._id,
        storageId,
        fileSize: replaceFile.size,
        fileType: "application/pdf",
        actorId: user._id,
      });

      setUploadSuccess(`Document '${replacingDoc.title}' replaced successfully.`);
      setReplacingDoc(null);
      setReplaceFile(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to replace document.");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDelete = async (docId: Id<"documents">, title: string) => {
    if (!user || !canModify) return;
    if (!confirm(`Are you sure you want to delete PDF document '${title}'?`)) return;

    try {
      await deleteDocumentMut({
        documentId: docId,
        actorId: user._id,
      });
      setUploadSuccess(`Document '${title}' deleted.`);
    } catch (err: any) {
      setUploadError(err.message || "Failed to delete document.");
    }
  };

  // Utility to Format File Size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="card card-erp mt-4">
      {/* Header */}
      <div className="card-header py-3 bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-dark fw-bold">
          <i className="bi bi-file-earmark-pdf-fill me-2 text-danger"></i>
          EMPLOYEE DOCUMENTS
        </h5>
        <span className="badge bg-secondary">{documents.length} PDF Documents</span>
      </div>

      <div className="card-body p-4">
        {/* Feedback Alerts */}
        {uploadError && (
          <div className="alert alert-danger rounded-0 py-2 small mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="alert alert-success rounded-0 py-2 small mb-3" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {uploadSuccess}
          </div>
        )}

        {/* Upload Form Card */}
        {canModify && (
          <div className="card card-erp bg-light mb-4 border border-secondary">
            <div className="card-body p-3">
              <h6 className="fw-bold text-dark mb-3">Upload New PDF Document(s)</h6>
              <form onSubmit={handleUploadSubmit}>
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-dark">Document Title (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Employment Contract 2026"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>

                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-dark">Select PDF File(s) (Optional) (Max 10 MB)</label>
                    <input
                      type="file"
                      accept="application/pdf, .pdf"
                      multiple
                      className="form-control form-control-sm"
                      onChange={handleFileSelect}
                    />
                  </div>

                  <div className="col-md-2 d-grid">
                    <button
                      type="submit"
                      className="btn btn-erp-danger btn-sm fw-bold mt-2 mt-md-4"
                      disabled={isUploading || selectedPdfFiles.length === 0}
                    >
                      {isUploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          UPLOADING...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-upload me-1"></i> UPLOAD PDF
                        </>
                      )}
                    </button>
                  </div>

                  {selectedPdfFiles.length > 0 && (
                    <div className="col-12">
                      <div className="small text-success fw-bold">
                        Selected Files ({selectedPdfFiles.length}):{" "}
                        {selectedPdfFiles.map((f) => f.name).join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toolbar: Search & Sort */}
        <div className="row g-3 mb-3 align-items-center">
          <div className="col-md-8">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search documents by title or file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light small">Sort:</span>
              <select
                className="form-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Table */}
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle mb-0">
            <thead className="table-light text-dark small">
              <tr>
                <th className="ps-3">DOCUMENT TITLE</th>
                <th>UPLOAD DATE</th>
                <th>FILE SIZE</th>
                <th>UPLOADED BY</th>
                <th className="text-end pe-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    <i className="bi bi-folder2-open display-6 d-block mb-2 text-secondary"></i>
                    No PDF documents found in Employee Document Vault.
                  </td>
                </tr>
              ) : (
                documents.map((doc: any) => (
                  <tr key={doc._id}>
                    <td className="ps-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-file-earmark-pdf-fill fs-4 text-danger me-3"></i>
                        <div>
                          <div className="fw-bold text-dark">{doc.title}</div>
                          <small className="text-muted">{doc.fileName || "document.pdf"}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <small className="text-dark">
                        {new Date(doc.createdAt).toLocaleDateString()} {new Date(doc.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    </td>

                    <td>
                      <small className="badge bg-light text-dark border">
                        {formatFileSize(doc.fileSize)}
                      </small>
                    </td>

                    <td>
                      <small className="text-muted">{doc.userName || "System"}</small>
                    </td>

                    <td className="text-end pe-3">
                      <div className="btn-group btn-group-sm">
                        {/* Preview Action */}
                        {doc.fileUrl ? (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-primary"
                            title="Preview PDF"
                          >
                            <i className="bi bi-eye me-1"></i> Preview
                          </a>
                        ) : (
                          <button disabled className="btn btn-outline-secondary">
                            Processing
                          </button>
                        )}

                        {/* Download Action */}
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            download={doc.fileName || `${doc.title}.pdf`}
                            className="btn btn-outline-secondary"
                            title="Download PDF"
                          >
                            <i className="bi bi-download me-1"></i> Download
                          </a>
                        )}

                        {/* Replace Action */}
                        {canModify && (
                          <button
                            type="button"
                            className="btn btn-outline-warning text-dark"
                            onClick={() => {
                              setReplacingDoc(doc);
                              setReplaceFile(null);
                            }}
                            title="Replace File"
                          >
                            <i className="bi bi-arrow-repeat me-1"></i> Replace
                          </button>
                        )}

                        {/* Delete Action */}
                        {canModify && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(doc._id, doc.title)}
                            title="Delete Document"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPLACE DOCUMENT MODAL */}
      {replacingDoc && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-0">
              <form onSubmit={handleReplaceSubmit}>
                <div className="modal-header bg-light py-2">
                  <h5 className="modal-title fw-bold text-dark">Replace PDF Document</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setReplacingDoc(null)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 small mb-3">
                    Replacing file for: <strong>{replacingDoc.title}</strong>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">Select New PDF File * (Max 10 MB)</label>
                    <input
                      type="file"
                      accept="application/pdf, .pdf"
                      className="form-control"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setReplaceFile(e.target.files[0]);
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="submit" className="btn btn-erp-danger btn-sm px-4 fw-bold" disabled={isUploading || !replaceFile}>
                    {isUploading ? "REPLACING..." : "CONFIRM REPLACE"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setReplacingDoc(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
