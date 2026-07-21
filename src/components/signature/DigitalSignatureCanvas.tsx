"use client";

import React, { useRef, useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface DigitalSignatureCanvasProps {
  onSignatureCaptured: (storageId: string) => void;
  onCancel: () => void;
}

export function DigitalSignatureCanvas({
  onSignatureCaptured,
  onCancel,
}: DigitalSignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrlMut = useMutation(api.attendance.generateUploadUrl);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    }
  };

  const handleSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert("Please draw your signature before confirming approval.");
      return;
    }
    setIsUploading(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Failed to export signature image.");
          setIsUploading(false);
          return;
        }

        const postUrl = await generateUploadUrlMut();
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: blob,
        });

        const { storageId } = await res.json();
        onSignatureCaptured(storageId);
      }, "image/png");
    } catch (err: any) {
      alert(err.message || "Failed to save digital signature.");
      setIsUploading(false);
    }
  };

  return (
    <div className="card card-erp p-3 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label fw-bold small text-dark mb-0">
          <i className="bi bi-vector-pen me-1 text-danger"></i> DRAW DIGITAL SIGNATURE (Mouse or Touch)
        </label>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm py-0 px-2 rounded-0"
          onClick={handleClear}
        >
          <i className="bi bi-eraser me-1"></i> CLEAR CANVAS
        </button>
      </div>

      {/* Signature Canvas Box */}
      <div className="border bg-white text-center position-relative mb-3">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          className="w-100"
          style={{ touchAction: "none", cursor: "crosshair", backgroundColor: "#ffffff" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        ></canvas>
        {!hasDrawn && (
          <div
            className="position-absolute top-50 start-50 translate-middle text-muted small pointer-events-none"
            style={{ pointerEvents: "none", opacity: 0.5 }}
          >
            Sign Here using Mouse Cursor or Touchscreen
          </div>
        )}
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-erp-secondary btn-sm" onClick={onCancel}>
          CANCEL
        </button>
        <button
          type="button"
          className="btn btn-erp-danger btn-sm"
          onClick={handleSaveSignature}
          disabled={!hasDrawn || isUploading}
        >
          {isUploading ? "UPLOADING SIGNATURE..." : "SIGN & CONFIRM APPROVAL"}
        </button>
      </div>
    </div>
  );
}
