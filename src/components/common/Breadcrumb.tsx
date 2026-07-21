"use client";

import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className="mb-2">
      <ol className="breadcrumb small mb-0">
        <li className="breadcrumb-item">
          <Link href="/dashboard" className="text-secondary text-decoration-none">
            <i className="bi bi-house-door me-1"></i> Home
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return isLast || !item.href ? (
            <li key={idx} className="breadcrumb-item active text-dark fw-bold" aria-current="page">
              {item.label}
            </li>
          ) : (
            <li key={idx} className="breadcrumb-item">
              <Link href={item.href} className="text-secondary text-decoration-none">
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
