"use client";

import React from "react";
import { Breadcrumb, BreadcrumbItem } from "../common/Breadcrumb";

interface EnterprisePageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function EnterprisePageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: EnterprisePageHeaderProps) {
  return (
    <div className="erp-section-header mb-4">
      <Breadcrumb items={breadcrumbs} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">{title}</h4>
          {subtitle && <p className="text-muted mb-0 small">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
