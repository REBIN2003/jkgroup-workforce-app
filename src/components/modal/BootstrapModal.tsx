"use client";

import React, { useEffect } from "react";

interface BootstrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function BootstrapModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: BootstrapModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050 }}
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ zIndex: 1055 }}
        aria-modal="true"
        role="dialog"
      >
        <div className={`modal-dialog modal-${size} modal-dialog-centered`}>
          <div className="modal-content rounded-0 border shadow-sm">
            <div className="modal-header bg-light py-2 px-3 border-bottom rounded-0">
              <h6 className="modal-title fw-bold text-dark">{title}</h6>
              <button
                type="button"
                className="btn-close text-reset"
                aria-label="Close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body p-3">{children}</div>
            {footer && <div className="modal-footer bg-light py-2 px-3 border-top rounded-0">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
