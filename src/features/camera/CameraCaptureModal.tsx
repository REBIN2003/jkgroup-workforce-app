"use client";

import React, { useRef, useState, useEffect } from "react";
import { BootstrapModal } from "../../components/modal/BootstrapModal";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const projects = useQuery(api.projects.listProjects, {}) || [];
  const generateUploadUrlMut = useMutation(api.attendance.generateUploadUrl);
  const uploadWorkPhotoMut = useMutation(api.work_photos.uploadWorkPhoto);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setErrorMsg("Camera permission denied or camera device unavailable. Use standard file upload instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTakeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);

        canvas.toBlob((blob) => {
          if (blob) setCapturedBlob(blob);
        }, "image/jpeg", 0.85);
      }
    }
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleUploadPhoto = async () => {
    if (!capturedBlob || !userId) {
      alert("Capture a photo snapshot first.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const postUrl = await generateUploadUrlMut();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: capturedBlob,
      });
      const { storageId } = await res.json();

      await uploadWorkPhotoMut({
        userId: userId as any,
        projectId: selectedProject ? (selectedProject as any) : undefined,
        storageId: storageId as any,
        photoType: "site_work",
        notes: notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload photo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BootstrapModal
      isOpen={isOpen}
      onClose={onClose}
      title="WEBCAM WORK PHOTO SNAPSHOT CAPTURE"
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button type="button" className="btn btn-erp-secondary btn-sm" onClick={onClose}>
            CANCEL
          </button>
          {capturedImage ? (
            <>
              <button type="button" className="btn btn-outline-dark btn-sm rounded-0" onClick={handleRetake}>
                <i className="bi bi-arrow-counterclockwise me-1"></i> RETAKE
              </button>
              <button
                type="button"
                className="btn btn-erp-danger btn-sm"
                onClick={handleUploadPhoto}
                disabled={isSubmitting}
              >
                {isSubmitting ? "UPLOADING..." : "UPLOAD PHOTO"}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-erp-danger btn-sm" onClick={handleTakeSnapshot}>
              <i className="bi bi-camera me-1"></i> TAKE SNAPSHOT
            </button>
          )}
        </div>
      }
    >
      <div>
        {errorMsg && (
          <div className="alert alert-warning rounded-0 py-2 small mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMsg}
          </div>
        )}

        <div className="row g-3">
          <div className="col-md-7">
            <div className="bg-dark text-center position-relative border" style={{ minHeight: "280px" }}>
              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100 h-100"
                  style={{ maxHeight: "320px", objectFit: "cover" }}
                ></video>
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured Snapshot"
                  className="w-100 h-100"
                  style={{ maxHeight: "320px", objectFit: "cover" }}
                />
              )}
              <canvas ref={canvasRef} className="d-none"></canvas>
            </div>
            <div className="small text-muted mt-1 text-center">
              Timestamp: <strong>{new Date().toLocaleString()}</strong>
            </div>
          </div>

          <div className="col-md-5">
            <div className="mb-3">
              <label className="form-label fw-bold small">Link to Assigned Project (Optional)</label>
              <select
                className="form-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">-- General Site / Unassigned --</option>
                {projects.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small">Work Photo Notes / Location</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Site progress inspection photo for foundation phase..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </BootstrapModal>
  );
}
