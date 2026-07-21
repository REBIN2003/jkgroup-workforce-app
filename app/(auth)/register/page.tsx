"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { registrationSchema, RegistrationFormValues } from "../../../src/schemas/registration";
import { TopNavbar } from "../../../src/components/layout/TopNavbar";
import Link from "next/link";

type Step = "FORM" | "OTP" | "SUCCESS";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("FORM");
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload States
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<{ file: File; category: string }[]>([]);

  // Convex Mutations
  const generateUploadUrlMut = useMutation(api.registrations.generateUploadUrl);
  const registerUserMut = useMutation(api.registrations.registerUser);
  const verifyOtpMut = useMutation(api.registrations.verifyRegistrationOtp);
  const resendOtpMut = useMutation(api.registrations.resendRegistrationOtp);

  // Form setup
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      roleName: "Employee",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  // Handle Document Selection
  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setDocFiles((prev) => [...prev.filter((d) => d.category !== category), { file: selected, category }]);
    }
  };

  // Upload File to Convex Storage
  const uploadToStorage = async (file: File): Promise<string> => {
    const postUrl = await generateUploadUrlMut({});
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Failed to upload file ${file.name}`);
    }
    const { storageId } = await res.json();
    return storageId;
  };

  // Step 1 Submission: Form + Storage Upload
  const onFormSubmit = async (values: RegistrationFormValues) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      // 1. Upload Profile Photo if selected
      let profileStorageId: any = undefined;
      if (profileImageFile) {
        profileStorageId = await uploadToStorage(profileImageFile);
      }

      // 2. Upload Verification Documents
      const uploadedDocsList = [];
      for (const d of docFiles) {
        const storageId = await uploadToStorage(d.file);
        uploadedDocsList.push({
          storageId: storageId as any,
          fileName: `${d.category} - ${d.file.name}`,
          fileType: d.file.type,
        });
      }

      // 3. Call Registration Mutation
      const res = await registerUserMut({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        country: values.country,
        roleName: values.roleName,
        password: values.password,
        profileImageStorageId: profileStorageId,
        uploadedDocuments: uploadedDocsList,
      });

      setRegisteredUserId(res.userId as any);
      setOtpInfo(`OTP Code sent to ${values.email}: ${res.otpCode}`);
      setStep("OTP");
    } catch (err: any) {
      setFormError(err.message || "Registration failed. Please check form details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Submission: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredUserId) return;
    if (!otpCodeInput || otpCodeInput.trim().length !== 6) {
      setFormError("Enter valid 6-digit OTP code");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await verifyOtpMut({
        userId: registeredUserId as any,
        otpCode: otpCodeInput.trim(),
      });
      setStep("SUCCESS");
    } catch (err: any) {
      setFormError(err.message || "Invalid OTP verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!registeredUserId) return;
    setIsSubmitting(true);
    try {
      const res = await resendOtpMut({ userId: registeredUserId as any });
      setOtpInfo(`New OTP Code generated: ${res.otpCode}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to resend OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 bg-white d-flex flex-column justify-content-center align-items-center py-5">
      {/* Top Header Bar */}
      <TopNavbar />

      <div style={{ maxWidth: "720px", width: "100%", marginTop: "40px" }}>
        <div className="card card-erp shadow-sm mb-5">
          <div className="card-header text-center py-3 bg-light">
            <h4 className="mb-1 text-dark fw-bold">CREATE CORPORATE ACCOUNT</h4>
            <small className="text-muted">Public Employee & Operational Registration Portal</small>
          </div>

          <div className="card-body p-4">
            {/* Feedback Error Alert */}
            {formError && (
              <div className="alert alert-danger rounded-0 py-2 small mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {formError}
              </div>
            )}

            {/* STEP 1: REGISTRATION FORM */}
            {step === "FORM" && (
              <form onSubmit={form.handleSubmit(onFormSubmit)}>
                <div className="row g-3">
                  {/* First Name */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">First Name *</label>
                    <input
                      type="text"
                      className={`form-control ${form.formState.errors.firstName ? "is-invalid" : ""}`}
                      placeholder="John"
                      {...form.register("firstName")}
                    />
                    {form.formState.errors.firstName && (
                      <div className="invalid-feedback">{form.formState.errors.firstName.message}</div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Last Name *</label>
                    <input
                      type="text"
                      className={`form-control ${form.formState.errors.lastName ? "is-invalid" : ""}`}
                      placeholder="Doe"
                      {...form.register("lastName")}
                    />
                    {form.formState.errors.lastName && (
                      <div className="invalid-feedback">{form.formState.errors.lastName.message}</div>
                    )}
                  </div>

                  {/* Corporate Email */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Corporate Email *</label>
                    <input
                      type="email"
                      className={`form-control ${form.formState.errors.email ? "is-invalid" : ""}`}
                      placeholder="john.doe@company.com"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <div className="invalid-feedback">{form.formState.errors.email.message}</div>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Mobile Phone Number *</label>
                    <input
                      type="text"
                      className={`form-control ${form.formState.errors.phone ? "is-invalid" : ""}`}
                      placeholder="+971 50 123 4567"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone && (
                      <div className="invalid-feedback">{form.formState.errors.phone.message}</div>
                    )}
                  </div>

                  {/* Country */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Country *</label>
                    <input
                      type="text"
                      className={`form-control ${form.formState.errors.country ? "is-invalid" : ""}`}
                      placeholder="United Arab Emirates"
                      {...form.register("country")}
                    />
                    {form.formState.errors.country && (
                      <div className="invalid-feedback">{form.formState.errors.country.message}</div>
                    )}
                  </div>

                  {/* Role Requested */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Role Requested *</label>
                    <select
                      className={`form-select ${form.formState.errors.roleName ? "is-invalid" : ""}`}
                      {...form.register("roleName")}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="General Manager">General Manager</option>
                    </select>
                    {form.formState.errors.roleName && (
                      <div className="invalid-feedback">{form.formState.errors.roleName.message}</div>
                    )}
                    <small className="text-muted d-block mt-1">
                      Note: Super Admin accounts cannot be requested publicly.
                    </small>
                  </div>

                  {/* Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Password *</label>
                    <input
                      type="password"
                      className={`form-control ${form.formState.errors.password ? "is-invalid" : ""}`}
                      placeholder="••••••••"
                      {...form.register("password")}
                    />
                    {form.formState.errors.password && (
                      <div className="invalid-feedback">{form.formState.errors.password.message}</div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Confirm Password *</label>
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

                  {/* File Upload Section */}
                  <div className="col-12 mt-4">
                    <h6 className="fw-bold border-bottom pb-2 text-dark">Verification Documents & Profile Photo</h6>
                  </div>

                  {/* Profile Photo (Optional) */}
                  <div className="col-md-6">
                    <label className="form-label small text-dark">Profile Photo (Optional)</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      className="form-control"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProfileImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <small className="text-muted">Formats: PNG, JPG (Max 5MB)</small>
                  </div>

                  {/* Passport Document */}
                  <div className="col-md-6">
                    <label className="form-label small text-dark">Passport Copy (PDF / Image)</label>
                    <input
                      type="file"
                      accept="application/pdf, image/png, image/jpeg, image/jpg"
                      className="form-control"
                      onChange={(e) => handleAddDocument(e, "Passport")}
                    />
                  </div>

                  {/* Visa / Driving License */}
                  <div className="col-md-6">
                    <label className="form-label small text-dark">Visa / ID / Driving License (PDF / Image)</label>
                    <input
                      type="file"
                      accept="application/pdf, image/png, image/jpeg, image/jpg"
                      className="form-control"
                      onChange={(e) => handleAddDocument(e, "Visa ID")}
                    />
                  </div>

                  {/* Certificates */}
                  <div className="col-md-6">
                    <label className="form-label small text-dark">Educational / Work Certificates</label>
                    <input
                      type="file"
                      accept="application/pdf, image/png, image/jpeg, image/jpg"
                      className="form-control"
                      onChange={(e) => handleAddDocument(e, "Certificates")}
                    />
                  </div>

                  {/* Accept Terms Checkbox */}
                  <div className="col-12 mt-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className={`form-check-input ${form.formState.errors.acceptTerms ? "is-invalid" : ""}`}
                        id="acceptTerms"
                        {...form.register("acceptTerms")}
                      />
                      <label className="form-check-label small text-dark" htmlFor="acceptTerms">
                        I confirm that all provided personal and professional information is true and accurate. I accept corporate compliance policies.
                      </label>
                      {form.formState.errors.acceptTerms && (
                        <div className="invalid-feedback d-block">{form.formState.errors.acceptTerms.message}</div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="col-12 d-grid mt-4">
                    <button type="submit" className="btn btn-erp-danger py-2 fw-bold" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          UPLOADING & REGISTERING...
                        </>
                      ) : (
                        "SUBMIT REGISTRATION"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: EMAIL OTP VERIFICATION */}
            {step === "OTP" && (
              <form onSubmit={handleVerifyOtp}>
                <div className="alert alert-info py-2 small mb-4">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  {otpInfo}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-dark">6-Digit Email OTP Code *</label>
                  <input
                    type="text"
                    className="form-control text-center fs-4 fw-bold letter-spacing-2"
                    placeholder="123456"
                    maxLength={6}
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value)}
                  />
                  <small className="text-muted">Check your inbox for the OTP code.</small>
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button type="submit" className="btn btn-erp-danger py-2 fw-bold" disabled={isSubmitting}>
                    {isSubmitting ? "VERIFYING OTP..." : "VERIFY EMAIL & SUBMIT"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                  >
                    Resend OTP Code
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: REGISTRATION SUBMITTED PENDING APPROVAL */}
            {step === "SUCCESS" && (
              <div className="text-center py-4">
                <div className="display-1 text-success mb-3">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <h4 className="fw-bold text-dark mb-2">REGISTRATION SUBMITTED SUCCESSFULLY</h4>
                <p className="text-muted mb-4">
                  Your email address has been verified. Your registration is now <strong>Pending Super Admin Approval</strong>. You will be able to log in once your account is reviewed and activated by an Administrator.
                </p>
                <Link href="/login" className="btn btn-erp-primary py-2 px-4 fw-bold">
                  RETURN TO LOGIN PORTAL
                </Link>
              </div>
            )}

            <div className="text-center mt-4 pt-3 border-top">
              <span className="small text-muted">Already have an account? </span>
              <Link href="/login" className="small text-primary text-decoration-none fw-bold">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
