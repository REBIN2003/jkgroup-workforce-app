"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { UserFormModal } from "../../../src/features/users/UserFormModal";
import { UserFormValues } from "../../../src/schemas/user";
import { useAuth } from "../../../src/hooks/useAuth";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface UserRow {
  _id: string;
  email: string;
  fullName: string;
  employeeId: string;
  roleId: string;
  roleName: string;
  companyName?: string;
  phone?: string;
  status: "active" | "inactive" | "suspended";
  createdAt: number;
}

const columnHelper = createColumnHelper<UserRow>();

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const usersList = useQuery(api.users.listUsers, {}) || [];
  const rolesList = useQuery(api.users.listRoles, {}) || [];

  const createUserMut = useMutation(api.users.createUser);
  const updateUserMut = useMutation(api.users.updateUser);
  const deleteUserMut = useMutation(api.users.deleteUser);

  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormValues | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "danger" | "success"; msg: string } | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<any | null>(null);

  // Filtered Data
  const data = useMemo(() => {
    return usersList.filter((u) => {
      const matchesRole = !roleFilter || u.roleId === roleFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;
      const matchesText =
        !globalFilter ||
        u.fullName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        u.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
        u.employeeId.toLowerCase().includes(globalFilter.toLowerCase());

      return matchesRole && matchesStatus && matchesText;
    });
  }, [usersList, globalFilter, roleFilter, statusFilter]);

  const handleEdit = (u: UserRow) => {
    setEditingUserId(u._id);
    setEditingUser({
      email: u.email,
      fullName: u.fullName,
      employeeId: u.employeeId,
      roleId: u.roleId,
      companyId: "",
      phone: u.phone || "",
      password: "",
      status: u.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (u: UserRow) => {
    if (confirm(`Are you sure you want to delete employee ${u.fullName} (${u.employeeId})?`)) {
      try {
        await deleteUserMut({ userId: u._id as any, actorId: currentUser?._id as any });
        setFeedback({ type: "success", msg: `Deleted employee account ${u.employeeId}` });
      } catch (err: any) {
        setFeedback({ type: "danger", msg: err.message || "Failed to delete employee account" });
      }
    }
  };

  const handleModalSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (editingUserId) {
        await updateUserMut({
          userId: editingUserId as any,
          fullName: values.fullName,
          phone: values.phone,
          status: values.status,
          roleId: values.roleId as any,
          actorId: currentUser?._id as any,
        });
        setFeedback({ type: "success", msg: "Employee details updated successfully." });
      } else {
        await createUserMut({
          email: values.email,
          fullName: values.fullName,
          employeeId: values.employeeId,
          roleId: values.roleId as any,
          phone: values.phone,
          password: values.password,
          actorId: currentUser?._id as any,
        });
        setFeedback({ type: "success", msg: "New employee account created successfully." });
      }
    } catch (err: any) {
      setFeedback({ type: "danger", msg: err.message || "Operation failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("employeeId", {
        header: "Emp ID",
        cell: (info) => <strong className="text-dark">{info.getValue()}</strong>,
      }),
      columnHelper.accessor("fullName", {
        header: "Employee Name",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("email", {
        header: "Corporate Email",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("roleName", {
        header: "RBAC Role",
        cell: (info) => (
          <span className="badge bg-secondary rounded-0">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const val = info.getValue();
          const badgeClass =
            val === "active" ? "bg-success" : val === "inactive" ? "bg-warning text-dark" : "bg-danger";
          return <span className={`badge ${badgeClass} rounded-0`}>{val.toUpperCase()}</span>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const u = info.row.original;
          const isSuperAdmin = currentUser?.roleName === "Super Admin";
          return (
            <div className="d-flex gap-1">
              <button
                type="button"
                className="btn btn-erp-secondary btn-sm py-0 px-2 rounded-0"
                onClick={() => setViewingEmployee(u as any)}
                title="View Employee Details"
              >
                <i className="bi bi-eye"></i> VIEW
              </button>
              {isSuperAdmin && (
                <>
                  <button
                    type="button"
                    className="btn btn-erp-primary btn-sm py-0 px-2"
                    onClick={() => handleEdit(u)}
                    title="Edit Employee"
                  >
                    <i className="bi bi-pencil"></i> EDIT
                  </button>
                  <button
                    type="button"
                    className="btn btn-erp-danger btn-sm py-0 px-2"
                    onClick={() => handleDelete(u)}
                    title="Delete Employee"
                  >
                    <i className="bi bi-trash"></i> DELETE
                  </button>
                </>
              )}
            </div>
          );
        },
      }),
    ],
    [currentUser]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div>
      <EnterprisePageHeader
        title="Employee Directory & RBAC Management"
        subtitle="Manage employee records, organization assignments, and system access roles"
        breadcrumbs={[{ label: "Employee Directory" }]}
        actions={
          currentUser?.roleName === "Super Admin" && (
            <button
              type="button"
              className="btn btn-erp-danger btn-sm"
              onClick={() => {
                setEditingUser(null);
                setEditingUserId(null);
                setIsModalOpen(true);
              }}
            >
              <i className="bi bi-person-plus-fill me-1"></i> ADD NEW EMPLOYEE
            </button>
          )
        }
      />

      {feedback && (
        <div className={`alert alert-${feedback.type} rounded-0 py-2 small mb-3`}>
          <i className={`bi ${feedback.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`}></i>
          {feedback.msg}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="card card-erp mb-3">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-md-5">
              <label className="form-label fw-bold small mb-1">Search Employee / Email / ID</label>
              <div className="input-group">
                <span className="input-group-text rounded-0 bg-light">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type to filter directory..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold small mb-1">Filter by RBAC Role</label>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">-- All System Roles --</option>
                {rolesList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small mb-1">Filter by Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">-- All Statuses --</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Data Table */}
      <div className="card card-erp">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <span><i className="bi bi-table me-2"></i>EMPLOYEE RECORDS ({data.length} Total)</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No employee records found matching filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enterprise Data Table Pagination Footer */}
        <div className="card-footer bg-light py-2 px-3 d-flex justify-content-between align-items-center">
          <div className="small text-muted">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="d-flex gap-1">
            <button
              className="btn btn-outline-secondary btn-sm py-0 px-2 rounded-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <i className="bi bi-chevron-left me-1"></i> PREV
            </button>
            <button
              className="btn btn-outline-secondary btn-sm py-0 px-2 rounded-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              NEXT <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        roles={rolesList}
        initialData={editingUser}
        isSubmitting={isSubmitting}
      />

      {/* Viewing Employee Details Modal */}
      {viewingEmployee && (
        <EmployeeDetailsModal
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

// Separate component for Employee Details Modal to handle hooks cleanly
interface EmployeeDetailsModalProps {
  employee: any;
  onClose: () => void;
  currentUser: any;
}

function EmployeeDetailsModal({ employee, onClose, currentUser }: EmployeeDetailsModalProps) {
  const isSuperAdmin = currentUser?.roleName === "Super Admin";

  const userDocs =
    useQuery(api.documents.listDocuments, {
      userId: employee._id,
      loggedInUserId: currentUser?._id,
      companyId: currentUser?.companyId,
      roleName: currentUser?.roleName,
    }) || [];

  const deleteDocumentMut = useMutation(api.documents.deleteDocument);
  const replaceDocumentMut = useMutation(api.documents.replaceDocumentFile);
  const generateUploadUrlMut = useMutation(api.documents.generateUploadUrl);

  const [replacingDoc, setReplacingDoc] = useState<any | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDeleteDoc = async (doc: any) => {
    if (!confirm(`Are you sure you want to delete PDF document '${doc.title}'?`)) return;
    try {
      await deleteDocumentMut({
        documentId: doc._id,
        actorId: currentUser?._id,
      });
      setFeedback(`Document '${doc.title}' deleted successfully.`);
    } catch (err: any) {
      alert(err.message || "Failed to delete document.");
    }
  };

  const handleReplaceDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingDoc || !replaceFile) return;
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrlMut();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": replaceFile.type },
        body: replaceFile,
      });
      const { storageId } = await res.json();

      await replaceDocumentMut({
        documentId: replacingDoc._id,
        storageId,
        fileSize: replaceFile.size,
        fileType: replaceFile.type,
        actorId: currentUser._id,
      });

      setFeedback(`Document '${replacingDoc.title}' replaced successfully.`);
      setReplacingDoc(null);
      setReplaceFile(null);
    } catch (err: any) {
      alert(err.message || "Failed to replace document.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1040 }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content rounded-0">
          <div className="modal-header bg-light py-2">
            <h5 className="modal-title fw-bold text-dark">
              <i className="bi bi-person-badge me-2 text-primary"></i>
              Employee Details: {employee.fullName}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
            {feedback && (
              <div className="alert alert-success rounded-0 py-2 small mb-3">
                <i className="bi bi-check-circle-fill me-2"></i>
                {feedback}
              </div>
            )}

            <div className="row g-4">
              {/* Photo & Role */}
              <div className="col-md-4 text-center border-end">
                {employee.profileImageUrl ? (
                  <img
                    src={employee.profileImageUrl}
                    alt={employee.fullName}
                    className="img-fluid rounded border mb-3"
                    style={{ maxHeight: "180px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="bg-secondary text-white rounded d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold"
                    style={{ width: "120px", height: "120px", fontSize: "2rem" }}
                  >
                    {employee.fullName ? employee.fullName.substring(0, 2).toUpperCase() : "E"}
                  </div>
                )}
                <h5 className="fw-bold text-dark mb-1">{employee.fullName}</h5>
                <span className="badge bg-primary px-3 py-1 mb-2">{employee.roleName}</span>
                <small className="d-block text-muted">
                  Employee ID: <strong>{employee.employeeId}</strong>
                </small>
                <small className="d-block text-muted">
                  Status: <strong className="text-success">{employee.status?.toUpperCase()}</strong>
                </small>
              </div>

              {/* Personal Details */}
              <div className="col-md-8">
                <h6 className="fw-bold border-bottom pb-2 text-dark">Personal Information</h6>
                <div className="row g-2 small">
                  <div className="col-6">
                    <span className="text-muted">Corporate Email:</span>
                    <div className="fw-bold text-dark">{employee.email}</div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Mobile Phone:</span>
                    <div className="fw-bold text-dark">{employee.phone || "N/A"}</div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Country:</span>
                    <div className="fw-bold text-dark">{employee.country || "N/A"}</div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Date of Birth:</span>
                    <div className="fw-bold text-dark">{employee.dateOfBirth || "N/A"}</div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Place of Birth:</span>
                    <div className="fw-bold text-dark">{employee.placeOfBirth || "N/A"}</div>
                  </div>
                  <div className="col-12 mt-2">
                    <span className="text-muted font-monospace">Accommodation Address:</span>
                    <div className="fw-bold text-dark bg-light p-2 border mt-1" style={{ whiteSpace: "pre-wrap" }}>
                      {employee.accommodationAddress || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                <h6 className="fw-bold border-bottom pb-2 text-dark mt-4">Uploaded Documents ({userDocs.length})</h6>
                {userDocs.length === 0 ? (
                  <div className="small text-muted italic">No documents found for this employee.</div>
                ) : (
                  <div className="table-responsive border">
                    <table className="table table-sm table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th className="ps-2">Title</th>
                          <th>Category</th>
                          <th className="text-end pe-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDocs.map((doc: any) => (
                          <tr key={doc._id}>
                            <td className="ps-2">
                              <span className="fw-bold text-dark">{doc.title}</span>
                            </td>
                            <td>
                              <span className="badge bg-secondary text-uppercase">{doc.documentType?.replace("_", " ")}</span>
                            </td>
                            <td className="text-end pe-2">
                              <div className="btn-group btn-group-sm">
                                {doc.fileUrl ? (
                                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary py-0 px-2">
                                    Preview
                                  </a>
                                ) : (
                                  <button disabled className="btn btn-outline-secondary py-0 px-2">Pending</button>
                                )}
                                {doc.fileUrl && (
                                  <a href={doc.fileUrl} download={doc.fileName || `${doc.title}.pdf`} className="btn btn-outline-secondary py-0 px-2">
                                    Download
                                  </a>
                                )}
                                {isSuperAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-outline-warning text-dark py-0 px-2"
                                      onClick={() => {
                                        setReplacingDoc(doc);
                                        setReplaceFile(null);
                                      }}
                                    >
                                      Replace
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger py-0 px-2"
                                      onClick={() => handleDeleteDoc(doc)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* REPLACE DOCUMENT SUB-MODAL */}
      {replacingDoc && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-0">
              <form onSubmit={handleReplaceDocSubmit}>
                <div className="modal-header bg-warning py-2 text-dark">
                  <h5 className="modal-title fw-bold">Replace File: {replacingDoc.title}</h5>
                  <button type="button" className="btn-close" onClick={() => setReplacingDoc(null)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">Select Replacement PDF/Image *</label>
                    <input
                      type="file"
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
                  <button type="submit" className="btn btn-warning btn-sm fw-bold px-4 text-dark" disabled={isUploading || !replaceFile}>
                    {isUploading ? "REPLACING..." : "CONFIRM REPLACE"}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReplacingDoc(null)}>
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
