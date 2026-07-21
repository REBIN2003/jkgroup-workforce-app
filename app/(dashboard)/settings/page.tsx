"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { useAuth } from "../../../src/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "company" | "email" | "work_hours" | "leave_rules" | "attendance_rules" | "notifications"
  >("company");

  // Local Form States
  const [systemName, setSystemName] = useState("JK Group Enterprise HRMS & ERP");
  const [supportEmail, setSupportEmail] = useState("support@jkgroup.com");
  const [smtpHost, setSmtpHost] = useState("smtp.jkgroup.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [senderEmail, setSenderEmail] = useState("noreply@jkgroup.com");
  const [stdHours, setStdHours] = useState("8.0");
  const [overtimeThreshold, setOvertimeThreshold] = useState("40.0");
  const [annualLeaveQuota, setAnnualLeaveQuota] = useState("20");
  const [sickLeaveQuota, setSickLeaveQuota] = useState("10");
  const [gracePeriodMins, setGracePeriodMins] = useState("15");
  const [mfaEnabled, setMfaEnabled] = useState(true);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Queries & Mutations
  const systemNameSetting = useQuery(api.settings.getSetting, { key: "system_name" });
  const setSettingMut = useMutation(api.settings.setSetting);

  useEffect(() => {
    if (systemNameSetting) setSystemName(systemNameSetting.value);
  }, [systemNameSetting]);

  const handleSaveSetting = async (key: string, value: string, label: string) => {
    if (!user) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await setSettingMut({
        key,
        value,
        userId: user._id as any,
      });
      setFeedback(`System configuration '${label}' updated successfully.`);
    } catch (err: any) {
      alert(err.message || "Failed to update setting.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Enterprise System Parameters & Security Rules"
        subtitle="Configure global company parameters, email SMTP settings, working hours, leave rules, and security controls"
        breadcrumbs={[{ label: "System Settings" }]}
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="card card-erp mb-4">
        <div className="card-header py-2 bg-light border-bottom">
          <ul className="nav nav-tabs card-header-tabs rounded-0">
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeTab === "company" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveTab("company")}
              >
                <i className="bi bi-building me-1"></i> Company Profile
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeTab === "email" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveTab("email")}
              >
                <i className="bi bi-envelope me-1"></i> Email & SMTP
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeTab === "work_hours" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveTab("work_hours")}
              >
                <i className="bi bi-clock me-1"></i> Working Hours & Overtime
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeTab === "leave_rules" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveTab("leave_rules")}
              >
                <i className="bi bi-calendar-check me-1"></i> Leave Quota Rules
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-1 ${activeTab === "attendance_rules" ? "active fw-bold text-danger" : "text-secondary"}`}
                onClick={() => setActiveTab("attendance_rules")}
              >
                <i className="bi bi-check2-square me-1"></i> Attendance Rules
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {/* Tab 1: Company Profile */}
          {activeTab === "company" && (
            <div className="row g-3 max-w-720">
              <h6 className="fw-bold text-dark border-bottom pb-2">COMPANY PROFILE PARAMETERS</h6>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Enterprise Application Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small">Corporate Support Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>

              <div className="col-md-12 text-end pt-2">
                <button
                  type="button"
                  className="btn btn-erp-danger btn-sm"
                  onClick={() => handleSaveSetting("system_name", systemName, "Application Title")}
                  disabled={isSaving}
                >
                  SAVE COMPANY PARAMETERS
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Email & SMTP Settings */}
          {activeTab === "email" && (
            <div className="row g-3 max-w-720">
              <h6 className="fw-bold text-dark border-bottom pb-2">SMTP SERVER & EMAIL CONFIGURATION</h6>
              <div className="col-md-8">
                <label className="form-label fw-bold small">SMTP Server Host</label>
                <input
                  type="text"
                  className="form-control"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold small">SMTP Port</label>
                <input
                  type="text"
                  className="form-control"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-bold small">Default Notification Sender Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>

              <div className="col-md-12 text-end pt-2">
                <button
                  type="button"
                  className="btn btn-erp-danger btn-sm"
                  onClick={() => handleSaveSetting("smtp_host", smtpHost, "SMTP Configuration")}
                  disabled={isSaving}
                >
                  SAVE EMAIL SETTINGS
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Working Hours */}
          {activeTab === "work_hours" && (
            <div className="row g-3 max-w-720">
              <h6 className="fw-bold text-dark border-bottom pb-2">STANDARD WORKING HOURS & OVERTIME RULES</h6>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Standard Daily Working Hours</label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.5"
                    className="form-control"
                    value={stdHours}
                    onChange={(e) => setStdHours(e.target.value)}
                  />
                  <span className="input-group-text rounded-0">Hours/Day</span>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small">Weekly Overtime Threshold</label>
                <div className="input-group">
                  <input
                    type="number"
                    step="1"
                    className="form-control"
                    value={overtimeThreshold}
                    onChange={(e) => setOvertimeThreshold(e.target.value)}
                  />
                  <span className="input-group-text rounded-0">Hours/Week</span>
                </div>
              </div>

              <div className="col-md-12 text-end pt-2">
                <button
                  type="button"
                  className="btn btn-erp-danger btn-sm"
                  onClick={() => handleSaveSetting("working_hours", stdHours, "Working Hours")}
                  disabled={isSaving}
                >
                  SAVE WORKING HOURS RULES
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Leave Quotas */}
          {activeTab === "leave_rules" && (
            <div className="row g-3 max-w-720">
              <h6 className="fw-bold text-dark border-bottom pb-2">ANNUAL LEAVE QUOTAS & POLICY RULES</h6>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Annual Paid Leave Allowance</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={annualLeaveQuota}
                    onChange={(e) => setAnnualLeaveQuota(e.target.value)}
                  />
                  <span className="input-group-text rounded-0">Days / Year</span>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small">Sick Leave Quota</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={sickLeaveQuota}
                    onChange={(e) => setSickLeaveQuota(e.target.value)}
                  />
                  <span className="input-group-text rounded-0">Days / Year</span>
                </div>
              </div>

              <div className="col-md-12 text-end pt-2">
                <button
                  type="button"
                  className="btn btn-erp-danger btn-sm"
                  onClick={() => handleSaveSetting("leave_quota", annualLeaveQuota, "Leave Quotas")}
                  disabled={isSaving}
                >
                  SAVE LEAVE RULES
                </button>
              </div>
            </div>
          )}

          {/* Tab 5: Attendance Rules */}
          {activeTab === "attendance_rules" && (
            <div className="row g-3 max-w-720">
              <h6 className="fw-bold text-dark border-bottom pb-2">ATTENDANCE GRACE PERIODS & LATE MARKING</h6>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Clock-In Grace Period</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={gracePeriodMins}
                    onChange={(e) => setGracePeriodMins(e.target.value)}
                  />
                  <span className="input-group-text rounded-0">Minutes</span>
                </div>
                <small className="text-muted">Clock-ins within this period will not be tagged as 'Late'.</small>
              </div>

              <div className="col-md-6">
                <div className="form-check form-switch mt-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="mfaSwitch"
                    checked={mfaEnabled}
                    onChange={(e) => setMfaEnabled(e.target.checked)}
                  />
                  <label className="form-check-label fw-bold small" htmlFor="mfaSwitch">
                    Enforce Multi-Factor / OTP Verification
                  </label>
                </div>
              </div>

              <div className="col-md-12 text-end pt-2">
                <button
                  type="button"
                  className="btn btn-erp-danger btn-sm"
                  onClick={() => handleSaveSetting("attendance_grace", gracePeriodMins, "Attendance Grace Period")}
                  disabled={isSaving}
                >
                  SAVE ATTENDANCE RULES
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
