"use client";

import React from "react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="container-fluid min-vh-100 bg-white d-flex flex-column justify-content-center align-items-center py-5">
      <div className="card card-erp shadow-sm text-center p-5" style={{ maxWidth: "520px", width: "100%" }}>
        <div className="mb-3 text-secondary" style={{ fontSize: "3.5rem" }}>
          <i className="bi bi-file-earmark-x"></i>
        </div>
        <h3 className="fw-bold text-dark mb-2">404 - RESOURCE NOT FOUND</h3>
        <p className="text-muted mb-4">
          The requested system path or document resource does not exist or has been relocated.
        </p>

        <div>
          <Link href="/dashboard" className="btn btn-erp-primary">
            <i className="bi bi-arrow-left me-1"></i> Return to Dashboard Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
