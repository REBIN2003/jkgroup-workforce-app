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
          return (
            <div className="d-flex gap-1">
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
            </div>
          );
        },
      }),
    ],
    []
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
    </div>
  );
}
