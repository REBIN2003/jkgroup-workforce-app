"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  passwordLoginSchema,
  otpLoginSchema,
  PasswordLoginFormValues,
  OtpLoginFormValues,
} from "../../../src/schemas/auth";
import { useAuth } from "../../../src/hooks/useAuth";
import { TopNavbar } from "../../../src/components/layout/TopNavbar";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convex mutations
  const loginWithPasswordMut = useMutation(api.auth.loginWithPassword);
  const requestOtpMut = useMutation(api.auth.requestOtp);
  const loginWithOtpMut = useMutation(api.auth.loginWithOtp);

  // Password Form - Fast Lightweight Defaults
  const passwordForm = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  // OTP Form
  const otpForm = useForm<OtpLoginFormValues>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: { email: "", otpCode: "" },
  });

  const handlePasswordSubmit = async (values: PasswordLoginFormValues) => {
    setAuthError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      const res = await loginWithPasswordMut({
        email: values.email,
        password: values.password,
      });

      login(res.sessionToken, res.user);
    } catch (err: any) {
      setAuthError(err.message || "Login failed. Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    const email = otpForm.getValues("email");
    if (!email || !email.includes("@")) {
      otpForm.setError("email", { message: "Enter a valid corporate email address first" });
      return;
    }
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const res = await requestOtpMut({ email });
      setOtpSent(true);
      setInfoMessage(res.message);
    } catch (err: any) {
      setAuthError(err.message || "Failed to generate OTP code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (values: OtpLoginFormValues) => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const res = await loginWithOtpMut({
        email: values.email,
        otpCode: values.otpCode,
      });
      login(res.sessionToken, res.user);
    } catch (err: any) {
      setAuthError(err.message || "Invalid or expired OTP code.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="container-fluid min-vh-100 bg-white d-flex flex-column justify-content-center align-items-center py-5">
      {/* Top Header Bar */}
      <TopNavbar />

      <div style={{ maxWidth: "460px", width: "100%", marginTop: "40px" }}>
        <div className="card card-erp shadow-sm">
          <div className="card-header text-center py-3 bg-light">
            <h5 className="mb-1 text-dark fw-bold">EMPLOYEE SYSTEM LOGIN</h5>
            <small className="text-muted">Enter credentials to access corporate portal</small>
          </div>

          <div className="card-body p-4">
            {/* Feedback Alerts */}
            {authError && (
              <div className="alert alert-danger rounded-0 py-2 small mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {authError}
              </div>
            )}

            {infoMessage && (
              <div className="alert alert-success rounded-0 py-2 small mb-3" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                {infoMessage}
              </div>
            )}

            {/* Login Type Tabs */}
            <ul className="nav nav-tabs nav-justified mb-4 rounded-0">
              <li className="nav-item">
                <button
                  className={`nav-link rounded-0 ${activeTab === "password" ? "active fw-bold border-bottom-0" : "text-secondary"}`}
                  onClick={() => {
                    setActiveTab("password");
                    setAuthError(null);
                  }}
                >
                  Password Login
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link rounded-0 ${activeTab === "otp" ? "active fw-bold border-bottom-0" : "text-secondary"}`}
                  onClick={() => {
                    setActiveTab("otp");
                    setAuthError(null);
                  }}
                >
                  Email OTP Login
                </button>
              </li>
            </ul>

            {/* Tab 1: Password Login Form */}
            {activeTab === "password" && (
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-dark">Corporate Email</label>
                  <input
                    type="email"
                    className={`form-control ${passwordForm.formState.errors.email ? "is-invalid" : ""}`}
                    placeholder="name@company.com"
                    {...passwordForm.register("email")}
                  />
                  {passwordForm.formState.errors.email && (
                    <div className="invalid-feedback">{passwordForm.formState.errors.email.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label fw-bold small text-dark mb-0">Password</label>
                    <Link href="/forgot-password" className="small text-primary text-decoration-none">
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    className={`form-control mt-1 ${passwordForm.formState.errors.password ? "is-invalid" : ""}`}
                    placeholder="••••••••"
                    {...passwordForm.register("password")}
                  />
                  {passwordForm.formState.errors.password && (
                    <div className="invalid-feedback">{passwordForm.formState.errors.password.message}</div>
                  )}
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button type="submit" className="btn btn-erp-danger py-2" disabled={isSubmitting}>
                    {isSubmitting ? "AUTHENTICATING..." : "SIGN IN TO PORTAL"}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: OTP Login Form */}
            {activeTab === "otp" && (
              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)}>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-dark">Corporate Email</label>
                  <div className="input-group">
                    <input
                      type="email"
                      className={`form-control ${otpForm.formState.errors.email ? "is-invalid" : ""}`}
                      placeholder="name@company.com"
                      {...otpForm.register("email")}
                    />
                    <button
                      type="button"
                      className="btn btn-erp-primary"
                      onClick={handleRequestOtp}
                      disabled={isSubmitting}
                    >
                      GET OTP
                    </button>
                  </div>
                  {otpForm.formState.errors.email && (
                    <div className="text-danger small mt-1">{otpForm.formState.errors.email.message}</div>
                  )}
                </div>

                {otpSent && (
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark">6-Digit OTP Code</label>
                    <input
                      type="text"
                      className={`form-control ${otpForm.formState.errors.otpCode ? "is-invalid" : ""}`}
                      placeholder="123456"
                      maxLength={6}
                      {...otpForm.register("otpCode")}
                    />
                    {otpForm.formState.errors.otpCode && (
                      <div className="invalid-feedback">{otpForm.formState.errors.otpCode.message}</div>
                    )}
                  </div>
                )}

                <div className="d-grid gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-erp-danger py-2"
                    disabled={isSubmitting || !otpSent}
                  >
                    {isSubmitting ? "VERIFYING..." : "VERIFY & LOGIN"}
                  </button>
                </div>
              </form>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}
