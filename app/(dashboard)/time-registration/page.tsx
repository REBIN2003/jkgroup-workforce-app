"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { timeRegistrationSchema, TimeRegistrationFormValues } from "../../../src/schemas/timeRegistration";
import { useAuth } from "../../../src/hooks/useAuth";
import { useDropzone } from "react-dropzone";

function getISOWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export default function TimeRegistrationPage() {
  const { user } = useAuth();

  const currentYearNum = new Date().getFullYear();
  const currentWeekNum = getISOWeekNumber(new Date());

  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeekNum);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Queries
  const projects = useQuery(api.projects.listProjects, {}) || [];
  const existingTimesheet = useQuery(
    api.time_registration.getTimesheet,
    user?._id
      ? {
          userId: user._id as any,
          year: selectedYear,
          weekNumber: selectedWeek,
        }
      : "skip"
  );

  const historyList = useQuery(
    api.time_registration.listTimesheets,
    user?._id ? { userId: user._id as any } : "skip"
  ) || [];

  const generateUploadUrlMut = useMutation(api.attendance.generateUploadUrl);
  const saveTimesheetMut = useMutation(api.time_registration.saveTimesheet);

  const form = useForm<TimeRegistrationFormValues>({
    resolver: zodResolver(timeRegistrationSchema),
    defaultValues: {
      year: selectedYear,
      weekNumber: selectedWeek,
      projectId: "",
      mon: 8,
      tue: 8,
      wed: 8,
      thu: 8,
      fri: 8,
      sat: 0,
      sun: 0,
      expenses: 0,
      travelKm: 0,
      description: "",
    },
  });

  const watchDaily = form.watch(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
  const totalWeeklyHours =
    (Number(watchDaily[0]) || 0) +
    (Number(watchDaily[1]) || 0) +
    (Number(watchDaily[2]) || 0) +
    (Number(watchDaily[3]) || 0) +
    (Number(watchDaily[4]) || 0) +
    (Number(watchDaily[5]) || 0) +
    (Number(watchDaily[6]) || 0);

  useEffect(() => {
    if (existingTimesheet) {
      form.reset({
        year: existingTimesheet.year,
        weekNumber: existingTimesheet.weekNumber,
        projectId: existingTimesheet.projectId || "",
        mon: existingTimesheet.dailyHours?.mon || 0,
        tue: existingTimesheet.dailyHours?.tue || 0,
        wed: existingTimesheet.dailyHours?.wed || 0,
        thu: existingTimesheet.dailyHours?.thu || 0,
        fri: existingTimesheet.dailyHours?.fri || 0,
        sat: existingTimesheet.dailyHours?.sat || 0,
        sun: existingTimesheet.dailyHours?.sun || 0,
        expenses: existingTimesheet.expenses || 0,
        travelKm: existingTimesheet.travelKm || 0,
        description: existingTimesheet.description || "",
      });
    } else {
      form.reset({
        year: selectedYear,
        weekNumber: selectedWeek,
        projectId: "",
        mon: 8,
        tue: 8,
        wed: 8,
        thu: 8,
        fri: 8,
        sat: 0,
        sun: 0,
        expenses: 0,
        travelKm: 0,
        description: "",
      });
    }
  }, [existingTimesheet, selectedYear, selectedWeek, form]);

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
  });

  const handleSave = async (status: "draft" | "submitted") => {
    if (!user) return;
    const values = form.getValues();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      let attachmentStorageId = undefined;
      if (selectedFile) {
        const postUrl = await generateUploadUrlMut();
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const { storageId } = await res.json();
        attachmentStorageId = storageId;
      }

      await saveTimesheetMut({
        userId: user._id as any,
        companyId: user.companyId || (user as any)._id,
        projectId: values.projectId ? (values.projectId as any) : undefined,
        year: selectedYear,
        weekNumber: selectedWeek,
        dailyHours: {
          mon: Number(values.mon) || 0,
          tue: Number(values.tue) || 0,
          wed: Number(values.wed) || 0,
          thu: Number(values.thu) || 0,
          fri: Number(values.fri) || 0,
          sat: Number(values.sat) || 0,
          sun: Number(values.sun) || 0,
        },
        expenses: Number(values.expenses) || 0,
        travelKm: Number(values.travelKm) || 0,
        description: values.description,
        attachmentStorageId: attachmentStorageId as any,
        status,
      });

      setFeedback(
        status === "submitted"
          ? `Timesheet for Week ${selectedWeek}/${selectedYear} submitted successfully.`
          : `Draft timesheet for Week ${selectedWeek}/${selectedYear} saved.`
      );
    } catch (err: any) {
      alert(err.message || "Failed to save timesheet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApproved = existingTimesheet?.status === "approved";

  return (
    <div>
      <EnterprisePageHeader
        title="Weekly Time Registration & Expense Declaration"
        subtitle="Log daily hours worked, travel mileage, expense receipts, and submit weekly timesheets for manager approval"
        breadcrumbs={[{ label: "Time Registration" }]}
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Week & Year Selector Bar */}
      <div className="card card-erp mb-4">
        <div className="card-header py-2">
          <i className="bi bi-calendar-range me-2"></i>WEEK & YEAR SELECTION
        </div>
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-3">
              <label className="form-label fw-bold small">Year</label>
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">Week Number (ISO)</label>
              <select
                className="form-select"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w} {w === currentWeekNum ? "(Current Week)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-5 text-end">
              <div className="small text-muted">Selected Registration Period</div>
              <strong className="fs-6 text-dark">
                Year {selectedYear} - Week {selectedWeek}
              </strong>
              {existingTimesheet && (
                <div className="mt-1">
                  <span
                    className={`badge ${
                      existingTimesheet.status === "approved"
                        ? "bg-success"
                        : existingTimesheet.status === "submitted"
                        ? "bg-warning text-dark"
                        : "bg-secondary"
                    } rounded-0 text-uppercase`}
                  >
                    STATUS: {existingTimesheet.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Hours Grid Form */}
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="card card-erp mb-4">
          <div className="card-header py-2 d-flex justify-content-between align-items-center">
            <span><i className="bi bi-grid-3x3-gap me-2"></i>WEEKLY HOURS DECLARATION GRID</span>
            <span className="badge bg-primary fs-6 rounded-0">TOTAL: {totalWeeklyHours} HOURS</span>
          </div>

          <div className="card-body p-3">
            <div className="mb-3">
              <label className="form-label fw-bold small">Select Assigned Project</label>
              <select
                className="form-select"
                disabled={isApproved}
                {...form.register("projectId")}
              >
                <option value="">-- General Working Hours --</option>
                {projects.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Daily Hours Inputs Table */}
            <div className="table-responsive mb-4">
              <table className="table erp-table table-bordered text-center align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>MON</th>
                    <th>TUE</th>
                    <th>WED</th>
                    <th>THU</th>
                    <th>FRI</th>
                    <th className="bg-light text-muted">SAT</th>
                    <th className="bg-light text-muted">SUN</th>
                    <th className="bg-dark text-white">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="form-control text-center"
                        disabled={isApproved}
                        {...form.register("mon", { valueAsNumber: true })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="form-control text-center"
                        disabled={isApproved}
                        {...form.register("tue", { valueAsNumber: true })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="form-control text-center"
                        disabled={isApproved}
                        {...form.register("wed", { valueAsNumber: true })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="form-control text-center"
                        disabled={isApproved}
                        {...form.register("thu", { valueAsNumber: true })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="form-control text-center"
                        disabled={isApproved}
                        {...form.register("fri", { valueAsNumber: true })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="form-control text-center"
                        disabled={isApproved}
                        {...form.register("sat", { valueAsNumber: true })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="form-control text-center"
                        disabled={isApproved}
                        {...form.register("sun", { valueAsNumber: true })}
                      />
                    </td>
                    <td className="fw-bold fs-5 text-dark bg-light">{totalWeeklyHours} hrs</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expenses & Travel Declaration Row */}
            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">EXPENSES & TRAVEL DECLARATION</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold small">Out-of-Pocket Expenses ($ USD)</label>
                <div className="input-group">
                  <span className="input-group-text rounded-0">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    disabled={isApproved}
                    {...form.register("expenses", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small">Business Travel Distance (KM)</label>
                <div className="input-group">
                  <input
                    type="number"
                    step="1"
                    className="form-control"
                    placeholder="0"
                    disabled={isApproved}
                    {...form.register("travelKm", { valueAsNumber: true })}
                  />
                  <span className="input-group-text rounded-0">KM</span>
                </div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-bold small">Description / Work Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Detail work performed, tasks completed, or expense justification..."
                  disabled={isApproved}
                  {...form.register("description")}
                ></textarea>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-bold small">Expense Receipt / Attachment</label>
                <div
                  {...getRootProps()}
                  className="border p-3 text-center bg-light"
                  style={{ cursor: isApproved ? "not-allowed" : "pointer", borderStyle: "dashed" }}
                >
                  <input {...getInputProps()} disabled={isApproved} />
                  {selectedFile ? (
                    <span className="text-success fw-bold small">
                      <i className="bi bi-file-earmark-check me-1"></i> {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : existingTimesheet?.attachmentUrl ? (
                    <span className="text-primary small">
                      <i className="bi bi-paperclip me-1"></i> View Existing Receipt Attachment
                    </span>
                  ) : (
                    <span className="small text-muted">Click or drag & drop expense receipts / work log files</span>
                  )}
                </div>
              </div>
            </div>

            {!isApproved && (
              <div className="d-flex justify-content-end gap-2 border-top pt-3">
                <button
                  type="button"
                  className="btn btn-erp-secondary btn-sm"
                  onClick={() => handleSave("draft")}
                  disabled={isSubmitting}
                >
                  SAVE DRAFT
                </button>
                <button
                  type="button"
                  className="btn btn-erp-danger btn-sm"
                  onClick={() => handleSave("submitted")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT TIMESHEET FOR APPROVAL"}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Registration History Table */}
      <div className="card card-erp">
        <div className="card-header py-2">
          <i className="bi bi-history me-2"></i>PREVIOUS TIMESHEET REGISTRATION HISTORY
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Project</th>
                  <th>Total Hours</th>
                  <th>Expenses</th>
                  <th>Travel (KM)</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                </tr>
              </thead>
              <tbody>
                {historyList.length > 0 ? (
                  historyList.map((t: any) => (
                    <tr key={t._id}>
                      <td>
                        <strong>
                          Year {t.year} - Week {t.weekNumber}
                        </strong>
                      </td>
                      <td>{t.projectName}</td>
                      <td>
                        <strong>{t.totalHours} hrs</strong>
                      </td>
                      <td>${t.expenses || 0}</td>
                      <td>{t.travelKm || 0} KM</td>
                      <td>
                        <span
                          className={`badge ${
                            t.status === "approved"
                              ? "bg-success"
                              : t.status === "submitted"
                              ? "bg-warning text-dark"
                              : "bg-secondary"
                          } rounded-0 text-uppercase`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td>{t.submittedAt ? new Date(t.submittedAt).toLocaleDateString() : "Draft"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No timesheet registration history found.
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
