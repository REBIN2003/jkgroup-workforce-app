"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION_ITEMS } from "../../constants/rbac";
import { useAuth } from "../../hooks/useAuth";

export function LeftSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  return (
    <aside className={`erp-sidebar flex-shrink-0 ${isOpen ? "open" : ""}`}>
      <div className="py-2 text-uppercase fw-bold text-muted px-3 border-bottom small" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
        SYSTEM MODULES
      </div>
      <nav className="nav flex-column">
        {NAVIGATION_ITEMS.map((item) => {
          if (item.permission && !hasPermission(item.permission)) {
            return null; // RBAC permission filtering
          }

          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`erp-sidebar-link ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <i className={`bi ${item.icon} me-2 fs-6`}></i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
