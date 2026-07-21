"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "../../src/components/auth/ProtectedRoute";
import { TopNavbar } from "../../src/components/layout/TopNavbar";
import { LeftSidebar } from "../../src/components/layout/LeftSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on path changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <ProtectedRoute>
      <div className={`d-flex flex-column min-vh-100 bg-white ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <TopNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="d-flex flex-grow-1 position-relative" style={{ marginTop: "52px" }}>
          {isSidebarOpen && (
            <div
              className="sidebar-overlay d-lg-none"
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: "fixed",
                top: "52px",
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                zIndex: 1030,
              }}
            />
          )}
          <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className="flex-grow-1 erp-content-container overflow-auto" style={{ minWidth: 0 }}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
