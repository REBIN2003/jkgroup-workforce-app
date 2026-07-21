"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (permission && !hasPermission(permission)) {
        router.push("/403");
      }
    }
  }, [isLoading, isAuthenticated, permission, hasPermission, router]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="fw-bold text-dark mb-0">Verifying Security Credentials...</p>
          <small className="text-muted">Enterprise Workforce Management ERP</small>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (permission && !hasPermission(permission))) {
    return null;
  }

  return <>{children}</>;
}
