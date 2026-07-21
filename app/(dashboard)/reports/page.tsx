"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { DownloadReportPdfButton } from "../../../src/components/pdf/EnterpriseReportPdf";

export default function ReportsPage() {
  const [subject, setSubject] = useState<"employee" | "project" | "attendance" | "leave">("employee");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Query Data Matrix
  const reportData = useQuery(api.reports.generateEnterpriseReportData, {
    reportSubject: subject,
    period,
    date,
  });

  const headers = reportData?.headers || [];
  const rows = reportData?.rows || [];
  const reportTitle = reportData?.title || "Enterprise Report";

  // CSV Export Helper
  const handleExportCsv = () => {
    if (!rows.length) return;
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of rows) {
      const values = Object.values(row).map((val) => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(values.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Enterprise_${subject}_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Enterprise Reports Generator"
        subtitle="Generate, preview, export CSV datasets, print, and download PDF management reports"
        breadcrumbs={[{ label: "Enterprise Reports" }]}
        actions={
          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-outline-dark btn-sm rounded-0"
              onClick={handlePrint}
            >
              <i className="bi bi-printer me-1"></i> PRINT REPORT
            </button>

            <button
              type="button"
              className="btn btn-outline-success btn-sm rounded-0 fw-bold"
              onClick={handleExportCsv}
              disabled={!rows.length}
            >
              <i className="bi bi-file-earmark-spreadsheet me-1"></i> EXPORT CSV
            </button>

            {rows.length > 0 && (
              <DownloadReportPdfButton
                title={reportTitle}
                headers={headers}
                rows={rows}
                generatedAt={new Date().toLocaleString()}
              />
            )}
          </div>
        }
      />

      {/* Control Panel Filter Toolbar */}
      <div className="card card-erp mb-4">
        <div className="card-header py-2">
          <i className="bi bi-sliders me-2"></i>REPORT PARAMETERS & FILTER CRITERIA
        </div>
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-bold small">Report Data Subject</label>
              <select
                className="form-select"
                value={subject}
                onChange={(e: any) => setSubject(e.target.value)}
              >
                <option value="employee">Employee Directory Report</option>
                <option value="project">Enterprise Projects Report</option>
                <option value="attendance">Workforce Attendance Log</option>
                <option value="leave">Employee Leave Applications</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">Period Aggregation</label>
              <select
                className="form-select"
                value={period}
                onChange={(e: any) => setPeriod(e.target.value)}
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Summary</option>
                <option value="monthly">Monthly Aggregate</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">Target Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Data Preview Table */}
      <div className="card card-erp">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-table me-2"></i>
            REPORT PREVIEW: {reportTitle.toUpperCase()} ({rows.length} Records)
          </span>
          <span className="badge bg-dark">PERIOD: {period.toUpperCase()}</span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table erp-table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row: any, rIdx: number) => (
                    <tr key={rIdx}>
                      {Object.values(row).map((val: any, cIdx: number) => (
                        <td key={cIdx}>
                          {cIdx === 0 ? <strong>{String(val)}</strong> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headers.length || 1} className="text-center text-muted py-4">
                      No data records available for selected report subject and filter parameters.
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
