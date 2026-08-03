"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { otpRequestSchema, OtpRequestFormValues } from "../../../src/schemas/auth";
import { TopNavbar } from "../../../src/components/layout/TopNavbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestOtpMut = useMutation(api.auth.requestOtp);

  const form = useForm<OtpRequestFormValues>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { email: "" },
  });

  const extractErrorMessage = (err: any, fallback: string) => {
    if (typeof err?.data === "string") return err.data;
    if (typeof err?.data?.message === "string") return err.data.message;
    if (typeof err?.message === "string") {
      return err.message
        .replace(/^Uncaught ConvexError:\s*/i, "")
        .replace(/^\[CONVEX M\([^)]+\)\]\s*/i, "")
        .replace(/^\[CONVEX [^\]]+\]\s*/i, "");
    }
    return fallback;
  };

  const onSubmit = async (values: OtpRequestFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const res = await requestOtpMut({ email: values.email });
      if (res.success) {
        setSuccessMsg(res.message + " Redirecting to reset password page...");
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
        }, 2000);
      } else {
        setErrorMsg(res.message || "Failed to process password recovery request.");
      }
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, "Failed to process password recovery request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 bg-white d-flex flex-column justify-content-center align-items-center py-5">
      <TopNavbar />

      <div style={{ maxWidth: "460px", width: "100%", marginTop: "40px" }}>
        <div className="card card-erp shadow-sm">
          <div className="card-header text-center py-3 bg-light">
            <h5 className="mb-1 text-dark fw-bold">FORGOT PASSWORD</h5>
            <small className="text-muted">Enter your registered email to receive an OTP code</small>
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
                <label className="form-label fw-bold small text-dark">Corporate Email Address</label>
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

              <div className="d-grid gap-2 mt-4">
                <button type="submit" className="btn btn-erp-danger py-2" disabled={isSubmitting}>
                  {isSubmitting ? "SENDING OTP..." : "REQUEST OTP CODE"}
                </button>
              </div>
            </form>

            <div className="text-center mt-4 pt-2 border-top">
              <Link href="/login" className="small text-primary text-decoration-none fw-bold">
                <i className="bi bi-arrow-left me-1"></i> Return to Login Screen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
