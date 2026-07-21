"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { useAuth } from "../../../src/hooks/useAuth";

export default function AttendancePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [mountedDate, setMountedDate] = useState("");

  React.useEffect(() => {
    setMountedDate(new Date().toLocaleDateString());
  }, []);
  const [feedback, setFeedback] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Optional Work Photo Upload State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoRemarks, setPhotoRemarks] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);

  // Queries & Mutations
  const todayRecord = useQuery(
    api.attendance.getTodayAttendance,
    user?._id ? { userId: user._id } : "skip"
  );

  const logs = useQuery(api.attendance.listAttendanceLogs, {
    date: selectedDate || undefined,
  }) || [];

  const userLogs = useQuery(api.attendance.listAttendanceLogs, {
    userId: user?._id ? user._id : undefined,
  }) || [];

  const companies = useQuery(api.companies.listCompanies, {}) || [];

  const clockInMut = useMutation(api.attendance.clockIn);
  const clockOutMut = useMutation(api.attendance.clockOut);
  const startBreakMut = useMutation(api.attendance.startBreak);
  const endBreakMut = useMutation(api.attendance.endBreak);
  const generateUploadUrlMut = useMutation(api.attendance.generateUploadUrl);
  const uploadWorkPhotoMut = useMutation(api.work_photos.uploadWorkPhoto);
  const createCompanyMut = useMutation(api.companies.createCompany);

  const isClockedIn = Boolean(todayRecord && !todayRecord.clockOutTime);
  const isClockedOut = Boolean(todayRecord && todayRecord.clockOutTime);
  const isOnBreak = Boolean(todayRecord && todayRecord.status === "on_break");

  // 1. Immediate One-Click Clock In
  const handleImmediateClockIn = async () => {
    if (!user) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      let targetCompanyId = user.companyId ? user.companyId : undefined;
      if (!targetCompanyId) {
        if (companies.length > 0) {
          targetCompanyId = companies[0]._id;
        } else {
          targetCompanyId = await createCompanyMut({
            name: "JK Group International",
            code: "JKG-001",
          });
        }
      }

      await clockInMut({
        userId: user._id,
        companyId: targetCompanyId,
      });
      const timeStr = new Date().toLocaleTimeString();
      setFeedback({
        type: "success",
        message: `Clocked in successfully at ${timeStr}. Attendance recorded immediately.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "danger",
        message: err.message || "Failed to clock in. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Immediate One-Click Clock Out
  const handleImmediateClockOut = async () => {
    if (!user) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      await clockOutMut({
        userId: user._id,
      });
      const timeStr = new Date().toLocaleTimeString();
      setFeedback({
        type: "success",
        message: `Clocked out successfully at ${timeStr}. Work hours finalized for today.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "danger",
        message: err.message || "Failed to clock out.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Immediate One-Click Start Break
  const handleStartBreak = async () => {
    if (!user) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      await startBreakMut({ userId: user._id });
      const timeStr = new Date().toLocaleTimeString();
      setFeedback({
        type: "success",
        message: `Break started successfully at ${timeStr}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "danger",
        message: err.message || "Failed to start break.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Immediate One-Click End Break
  const handleEndBreak = async () => {
    if (!user) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      await endBreakMut({ userId: user._id });
      const timeStr = new Date().toLocaleTimeString();
      setFeedback({
        type: "success",
        message: `Break ended successfully at ${timeStr}. Resumed active working hours.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "danger",
        message: err.message || "Failed to end break.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Separate Optional Work Photo Upload Handler
  const handleUploadWorkPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !photoFile) return;
    setIsUploadingPhoto(true);
    setPhotoFeedback(null);
    try {
      const uploadUrl = await generateUploadUrlMut();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photoFile.type },
        body: photoFile,
      });
      const { storageId } = (await res.json()) as { storageId: any };

      await uploadWorkPhotoMut({
        userId: user._id,
        storageId: storageId,
        photoType: isClockedIn ? "site_work" : "clock_in",
        notes: photoRemarks || undefined,
      });

      setPhotoFeedback("Work photo uploaded successfully to Convex Storage.");
      setPhotoFile(null);
      setPhotoRemarks("");
    } catch (err: any) {
      setPhotoFeedback("Photo upload failed: " + (err.message || "Network error"));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Summary Hours Calculations
  const todayBreakMinutes = todayRecord?.totalBreakMinutes || 0;
  const userPresentCount = userLogs.filter((l: any) => l.status === "present").length;
  const userLateCount = userLogs.filter((l: any) => l.status === "late").length;

  return (
    <div>
      <EnterprisePageHeader
        title="Attendance & Work Hour System"
        subtitle="Manage daily clock-in/out, break timers, and attendance history with 1-click execution"
        breadcrumbs={[{ label: "Attendance Log" }]}
        actions={
          <div className="d-flex gap-2 flex-wrap align-items-center">
            {/* 1-Click Clock In */}
            {!isClockedOut && !isClockedIn && (
              <button
                type="button"
                className="btn btn-erp-primary btn-sm px-3 fw-bold"
                onClick={handleImmediateClockIn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    CLOCKING IN...
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-circle me-1"></i> CLOCK-IN NOW
                  </>
                )}
              </button>
            )}

            {/* 1-Click Start Break */}
            {isClockedIn && !isOnBreak && (
              <button
                type="button"
                className="btn btn-warning btn-sm text-dark rounded-0 fw-bold px-3"
                onClick={handleStartBreak}
                disabled={isProcessing}
              >
                <i className="bi bi-cup-hot me-1"></i> START BREAK
              </button>
            )}

            {/* 1-Click End Break */}
            {isOnBreak && (
              <button
                type="button"
                className="btn btn-success btn-sm rounded-0 fw-bold px-3"
                onClick={handleEndBreak}
                disabled={isProcessing}
              >
                <i className="bi bi-play-fill me-1"></i> END BREAK & RESUME
              </button>
            )}

            {/* 1-Click Clock Out */}
            {isClockedIn && (
              <button
                type="button"
                className="btn btn-erp-danger btn-sm px-3 fw-bold"
                onClick={handleImmediateClockOut}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    CLOCKING OUT...
                  </>
                ) : (
                  <>
                    <i className="bi bi-stop-circle me-1"></i> CLOCK-OUT NOW
                  </>
                )}
              </button>
            )}
          </div>
        }
      />

      {/* Immediate Feedback Alert */}
      {feedback && (
        <div className={`alert alert-${feedback.type} rounded-0 py-2 small mb-4`} role="alert">
          <i className={`bi bi-${feedback.type === "success" ? "check-circle" : "exclamation-triangle"}-fill me-2`}></i>
          {feedback.message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">TODAY'S STATUS</span>
            <div className="fs-5 fw-bold mt-1">
              {todayRecord ? (
                <span
                  className={`badge ${
                    isOnBreak
                      ? "bg-warning text-dark"
                      : todayRecord.status === "present"
                      ? "bg-success"
                      : "bg-danger"
                  } rounded-0`}
                >
                  {isOnBreak ? "ON BREAK" : todayRecord.status.toUpperCase()}
                </span>
              ) : (
                <span className="badge bg-secondary rounded-0">NOT CLOCKED IN</span>
              )}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">TODAY'S BREAK TIME</span>
            <div className="fs-4 fw-bold text-dark mt-1">{todayBreakMinutes} Mins</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">MONTHLY DAYS PRESENT</span>
            <div className="fs-4 fw-bold text-success mt-1">{userPresentCount} Days</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card card-erp p-3 text-center">
            <span className="text-muted small fw-bold text-uppercase">LATE CLOCK-INS</span>
            <div className="fs-4 fw-bold text-warning mt-1">{userLateCount} Days</div>
          </div>
        </div>
      </div>

      {/* Real-Time Attendance Details Card */}
      <div className="card card-erp mb-4">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <span><i className="bi bi-clock me-2"></i>REAL-TIME ATTENDANCE STATUS ({mountedDate})</span>
          <span className="badge bg-dark">{user?.employeeId}</span>
        </div>
        <div className="card-body p-3">
          <div className="row g-3 text-center align-items-center">
            <div className="col-md-3 border-end-responsive">
              <span className="text-muted small d-block">Clock-In Timestamp</span>
              <strong className="fs-6 text-dark">
                {todayRecord?.clockInTime ? new Date(todayRecord.clockInTime).toLocaleTimeString() : "-- : --"}
              </strong>
            </div>

            <div className="col-md-3 border-end-responsive">
              <span className="text-muted small d-block">Break Start / End</span>
              <strong className="fs-6 text-dark">
                {todayRecord?.breakStartTime ? new Date(todayRecord.breakStartTime).toLocaleTimeString() : "--"} /{" "}
                {todayRecord?.breakEndTime ? new Date(todayRecord.breakEndTime).toLocaleTimeString() : "--"}
              </strong>
            </div>

            <div className="col-md-3 border-end-responsive">
              <span className="text-muted small d-block">Clock-Out Timestamp</span>
              <strong className="fs-6 text-dark">
                {todayRecord?.clockOutTime ? new Date(todayRecord.clockOutTime).toLocaleTimeString() : "-- : --"}
              </strong>
            </div>

            <div className="col-md-3">
              <span className="text-muted small d-block">Cumulative Break Duration</span>
              <strong className="fs-6 text-primary">{todayBreakMinutes} minutes</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SEPARATE OPTIONAL WORK PHOTO MODULE */}
      <div className="card card-erp mb-4">
        <div className="card-header py-2 bg-light d-flex justify-content-between align-items-center">
          <span className="fw-bold text-dark">
            <i className="bi bi-camera-fill me-2 text-danger"></i>
            UPLOAD WORK / SITE PHOTO (OPTIONAL)
          </span>
          <span className="badge bg-outline-secondary text-dark border">Supporting Feature</span>
        </div>
        <div className="card-body p-3">
          {photoFeedback && (
            <div className="alert alert-info py-2 small mb-3">
              <i className="bi bi-info-circle me-2"></i>
              {photoFeedback}
            </div>
          )}

          <form onSubmit={handleUploadWorkPhoto} className="row g-3 align-items-center">
            <div className="col-md-5">
              <label className="form-label small fw-bold text-dark mb-1">Select Photo (Camera or Gallery)</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="form-control form-control-sm"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPhotoFile(e.target.files[0]);
                  }
                }}
              />
              <small className="text-muted">Upload 0, 1, or multiple site verification photos.</small>
            </div>

            <div className="col-md-5">
              <label className="form-label small fw-bold text-dark mb-1">Optional Notes / Site Location</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Site inspection photo at Block B"
                value={photoRemarks}
                onChange={(e) => setPhotoRemarks(e.target.value)}
              />
            </div>

            <div className="col-md-2 d-grid">
              <button
                type="submit"
                className="btn btn-outline-dark btn-sm rounded-0 fw-bold mt-md-4"
                disabled={isUploadingPhoto || !photoFile}
              >
                {isUploadingPhoto ? "UPLOADING..." : "UPLOAD PHOTO"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <div className="card card-erp mb-3">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-bold small mb-1">Select Attendance Log Date</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              >
                Reset to Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Matrix Table */}
      <div className="card card-erp">
        <div className="card-header py-2">
          <i className="bi bi-table me-2"></i>WORKFORCE ATTENDANCE LOG MATRIX ({logs.length} Records)
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Employee Name</th>
                  <th>Date</th>
                  <th>Clock-In</th>
                  <th>Break Minutes</th>
                  <th>Clock-Out</th>
                  <th>Location / Project</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log: any) => (
                    <tr key={log._id}>
                      <td><strong>{log.employeeId}</strong></td>
                      <td>{log.userName}</td>
                      <td>{log.date}</td>
                      <td>{new Date(log.clockInTime).toLocaleTimeString()}</td>
                      <td>{log.totalBreakMinutes || 0} mins</td>
                      <td>{log.clockOutTime ? new Date(log.clockOutTime).toLocaleTimeString() : "-- : --"}</td>
                      <td>{log.projectName}</td>
                      <td>
                        <span
                          className={`badge ${
                            log.status === "on_break"
                              ? "bg-warning text-dark"
                              : log.status === "present"
                              ? "bg-success"
                              : "bg-danger"
                          } rounded-0`}
                        >
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No attendance log records found for selected date ({selectedDate}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
