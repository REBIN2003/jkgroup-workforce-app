"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { resetPasswordSchema, ResetPasswordFormValues } from "../../../src/schemas/auth";
import { TopNavbar } from "../../../src/components/layout/TopNavbar";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMut = useMutation(api.auth.resetPasswordWithOtp);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      otpCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [emailParam, form]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await resetMut({
        email: values.email,
        otpCode: values.otpCode,
        newPassword: values.newPassword,
      });
      setSuccessMsg("Password reset successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password. Verify OTP code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card card-erp shadow-sm" style={{ maxWidth: "460px", width: "100%", marginTop: "40px" }}>
      <div className="card-header text-center py-3 bg-light">
        <h5 className="mb-1 text-dark fw-bold">SET NEW PASSWORD</h5>
        <small className="text-muted">Enter received OTP and new corporate password</small>
      </div>

      <div className="card-body p-4">
        {errorMsg && (
          <div className="alert alert-danger rounded-0 py-2 small mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success rounded-0 py-2 small mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMsg}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">Corporate Email</label>
            <input
              type="email"
              className={`form-control ${form.formState.errors.email ? "is-invalid" : ""}`}
              placeholder="name@company.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <div className="invalid-feedback">{form.formState.errors.email.message}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">6-Digit OTP Code</label>
            <input
              type="text"
              className={`form-control ${form.formState.errors.otpCode ? "is-invalid" : ""}`}
              placeholder="123456"
              maxLength={6}
              {...form.register("otpCode")}
            />
            {form.formState.errors.otpCode && (
              <div className="invalid-feedback">{form.formState.errors.otpCode.message}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">New Password</label>
            <input
              type="password"
              className={`form-control ${form.formState.errors.newPassword ? "is-invalid" : ""}`}
              placeholder="••••••••"
              {...form.register("newPassword")}
            />
            {form.formState.errors.newPassword && (
              <div className="invalid-feedback">{form.formState.errors.newPassword.message}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">Confirm New Password</label>
            <input
              type="password"
              className={`form-control ${form.formState.errors.confirmPassword ? "is-invalid" : ""}`}
              placeholder="••••••••"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <div className="invalid-feedback">{form.formState.errors.confirmPassword.message}</div>
            )}
          </div>

          <div className="d-grid gap-2 mt-4">
            <button type="submit" className="btn btn-erp-danger py-2" disabled={isSubmitting}>
              {isSubmitting ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
            </button>
          </div>
        </form>

        <div className="text-center mt-4 pt-2 border-top">
          <Link href="/login" className="small text-primary text-decoration-none fw-bold">
            <i className="bi bi-arrow-left me-1"></i> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-fluid min-vh-100 bg-white d-flex flex-column justify-content-center align-items-center py-5">
      <TopNavbar />
      <Suspense fallback={<div>Loading form...</div>}>
        <ResetPasswordFormContent />
      </Suspense>
    </div>
  );
}
