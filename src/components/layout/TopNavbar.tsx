"use client";

import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export function TopNavbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = React.useState("");

  React.useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );
  }, []);

  const notifications = useQuery(
    api.notifications.listUserNotifications,
    user?._id ? { userId: user._id } : "skip"
  ) || [];

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <header className="w-100 erp-top-navbar d-flex align-items-center justify-content-between px-3 fixed-top z-3">
      <div className="d-flex align-items-center gap-2">
        {user && (
          <button
            type="button"
            className="btn text-white p-1 d-lg-none border-0"
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation Sidebar"
          >
            <i className="bi bi-list fs-4"></i>
          </button>
        )}
        <Link href="/" className="erp-brand-title d-flex align-items-center gap-2 text-decoration-none">
          <i className="bi bi-building-fill text-warning"></i>
          <span className="d-none d-sm-inline" style={{ fontSize: "0.95rem" }}>ENTERPRISE ERP WORKFORCE SYSTEM</span>
          <span className="d-inline d-sm-none" style={{ fontSize: "0.9rem" }}>ERP SYSTEM</span>
        </Link>
      </div>

      <div className="d-flex align-items-center gap-3 text-white">
        <div className="d-none d-md-block small text-light border-end pe-3">
          <i className="bi bi-calendar3 me-1"></i> {currentDate}
        </div>

        {!user ? (
          <div className="d-flex align-items-center gap-2">
            <Link href="/login" className="btn btn-outline-light btn-sm px-3 fw-bold rounded-0">
              <i className="bi bi-box-arrow-in-right me-1"></i> LOGIN
            </Link>
            <Link href="/register" className="btn btn-erp-danger btn-sm px-3 fw-bold rounded-0">
              <i className="bi bi-person-plus-fill me-1"></i> REGISTER ACCOUNT
            </Link>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-3">
            {/* Notifications Bell */}
            <Link
              href="/notifications"
              className="text-white text-decoration-none position-relative p-1"
              title="Notifications"
            >
              <i className="bi bi-bell fs-5"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "10px" }}>
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="text-end d-none d-sm-block">
              <div className="fw-bold small text-white">{user.fullName}</div>
              <div className="small text-light" style={{ fontSize: "11px" }}>
                {user.employeeId} | <span className="badge bg-warning text-dark">{user.roleName}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-erp-danger btn-sm py-1 px-3 ms-1"
              onClick={logout}
              title="Logout session"
            >
              <i className="bi bi-power me-1"></i> LOGOUT
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
