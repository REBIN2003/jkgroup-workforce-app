"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { BootstrapModal } from "../../components/modal/BootstrapModal";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "clock_in" | "clock_out";
  userId: string;
  companyId?: string;
  onSuccess: () => void;
}

export function ClockInModal({
  isOpen,
  onClose,
  mode,
  userId,
  companyId,
  onSuccess,
}: ClockInModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateUploadUrlMut = useMutation(api.attendance.generateUploadUrl);
  const clockInMut = useMutation(api.attendance.clockIn);
  const clockOutMut = useMutation(api.attendance.clockOut);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      let photoStorageId = undefined;

      if (selectedFile) {
        const postUrl = await generateUploadUrlMut();
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const { storageId } = await res.json();
        photoStorageId = storageId;
      }

      if (mode === "clock_in") {
        if (!companyId) {
          throw new Error("Company profile not assigned to employee account.");
        }
        await clockInMut({
          userId: userId as any,
          companyId: companyId as any,
          photoStorageId: photoStorageId as any,
          remarks: remarks || undefined,
        });
      } else {
        await clockOutMut({
          userId: userId as any,
          photoStorageId: photoStorageId as any,
          remarks: remarks || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Clock operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BootstrapModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "clock_in" ? "DAILY WORKFORCE CLOCK-IN" : "DAILY WORKFORCE CLOCK-OUT"}
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button type="button" className="btn btn-erp-secondary btn-sm" onClick={onClose}>
            CANCEL
          </button>
          <button
            type="button"
            className="btn btn-erp-danger btn-sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "PROCESSING..." : mode === "clock_in" ? "CONFIRM CLOCK-IN" : "CONFIRM CLOCK-OUT"}
          </button>
        </div>
      }
    >
      <div>
        {errorMsg && (
          <div className="alert alert-danger rounded-0 py-2 small mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMsg}
          </div>
        )}

        <div className="alert alert-info rounded-0 py-2 small mb-3">
          <i className="bi bi-clock me-2"></i>
          Current Time: <strong>{new Date().toLocaleTimeString()}</strong> | Date: <strong>{new Date().toLocaleDateString()}</strong>
        </div>

        {/* Work Photo Dropzone */}
        <div className="mb-3">
          <label className="form-label fw-bold small">Upload Site/Work Verification Photo (Optional)</label>
          <div
            {...getRootProps()}
            className={`border p-3 text-center bg-light ${isDragActive ? "border-primary" : "border-secondary"}`}
            style={{ cursor: "pointer", borderStyle: "dashed" }}
          >
            <input {...getInputProps()} />
            <i className="bi bi-camera fs-3 text-secondary d-block mb-1"></i>
            {selectedFile ? (
              <span className="text-success fw-bold small">
                <i className="bi bi-file-earmark-check me-1"></i> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              <span className="small text-muted">
                Drag & drop work verification photo here, or click to upload from camera/gallery
              </span>
            )}
          </div>
        </div>

        {/* Remarks / Work Location Input */}
        <div className="mb-2">
          <label className="form-label fw-bold small">Work Remarks / Site Location</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="e.g. On-site project inspection at HQ"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          ></textarea>
        </div>
      </div>
    </BootstrapModal>
  );
}
