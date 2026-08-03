"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { profileSchema, bankTaxSchema, ProfileFormValues, BankTaxFormValues } from "../../../src/schemas/profile";
import { useAuth } from "../../../src/hooks/useAuth";
import { EmployeeDocumentsSection } from "../../../src/components/profile/EmployeeDocumentsSection";

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"personal" | "bank">("personal");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Queries & Mutations
  const profile = useQuery(
    api.users.getUserProfile,
    authUser?._id ? { userId: authUser._id as any } : "skip"
  );

  const updateProfileMut = useMutation(api.users.updateProfile);
  const updateBankTaxMut = useMutation(api.users.updateBankAndTaxDetails);
  const generateUploadUrlMut = useMutation(api.attendance.generateUploadUrl);

  // Personal Form
  const personalForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      emergencyName: "",
      emergencyRelationship: "",
      emergencyPhone: "",
      dateOfBirth: "",
      placeOfBirth: "",
      accommodationAddress: "",
    },
  });

  // Bank & Tax Form
  const bankTaxForm = useForm<BankTaxFormValues>({
    resolver: zodResolver(bankTaxSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      iban: "",
      swift: "",
      taxId: "",
      taxCategory: "Standard Individual W-2",
    },
  });

  useEffect(() => {
    if (profile) {
      personalForm.reset({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        street: profile.address?.street || "",
        city: profile.address?.city || "",
        state: profile.address?.state || "",
        zip: profile.address?.zip || "",
        country: profile.address?.country || "United States",
        emergencyName: profile.emergencyContact?.name || "",
        emergencyRelationship: profile.emergencyContact?.relationship || "",
        emergencyPhone: profile.emergencyContact?.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        placeOfBirth: profile.placeOfBirth || "",
        accommodationAddress: profile.accommodationAddress || "",
      });

      bankTaxForm.reset({
        bankName: profile.bankDetails?.bankName || "",
        accountNumber: profile.bankDetails?.accountNumber || "",
        iban: profile.bankDetails?.iban || "",
        swift: profile.bankDetails?.swift || "",
        taxId: profile.taxDetails?.taxId || "",
        taxCategory: profile.taxDetails?.taxCategory || "Standard Individual W-2",
      });
    }
  }, [profile, personalForm, bankTaxForm]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    setIsUploadingAvatar(true);
    try {
      const postUrl = await generateUploadUrlMut();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();

      await updateProfileMut({
        userId: authUser._id as any,
        fullName: profile?.fullName || authUser.fullName,
        phone: profile?.phone,
        profileImageStorageId: storageId as any,
        address: profile?.address,
        emergencyContact: profile?.emergencyContact,
      });

      setFeedback("Profile picture updated successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to upload avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePersonalSubmit = async (values: ProfileFormValues) => {
    if (!authUser) return;
    setIsSaving(true);
    try {
      await updateProfileMut({
        userId: authUser._id as any,
        fullName: values.fullName,
        phone: values.phone,
        address: {
          street: values.street || "",
          city: values.city || "",
          state: values.state || "",
          zip: values.zip || "",
          country: values.country || "",
        },
        emergencyContact: {
          name: values.emergencyName || "",
          relationship: values.emergencyRelationship || "",
          phone: values.emergencyPhone || "",
        },
        dateOfBirth: values.dateOfBirth,
        placeOfBirth: values.placeOfBirth,
        accommodationAddress: values.accommodationAddress,
      });
      setFeedback("Personal details & emergency contact updated successfully.");
    } catch (err: any) {
      alert(err.message || "Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBankTaxSubmit = async (values: BankTaxFormValues) => {
    if (!authUser) return;
    setIsSaving(true);
    try {
      await updateBankTaxMut({
        userId: authUser._id as any,
        bankDetails: {
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          iban: values.iban,
          swift: values.swift,
        },
        taxDetails: {
          taxId: values.taxId,
          taxCategory: values.taxCategory,
        },
      });
      setFeedback("Bank account details & Tax registration updated successfully.");
    } catch (err: any) {
      alert(err.message || "Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        title="Employee Profile & Payroll Vault"
        subtitle="Manage employee personal info, address, emergency contact, IBAN/SWIFT bank details, and tax registration"
        breadcrumbs={[{ label: "My Profile" }]}
      />

      {feedback && (
        <div className="alert alert-success rounded-0 py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {feedback}
        </div>
      )}

      {/* Header Profile Identity Strip */}
      <div className="card card-erp mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center flex-wrap gap-4">
            <div className="position-relative">
              {profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt="Profile"
                  className="rounded-circle border"
                  style={{ width: "90px", height: "90px", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3"
                  style={{ width: "90px", height: "90px" }}
                >
                  {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "E"}
                </div>
              )}

              <label
                htmlFor="avatar-upload"
                className="btn btn-dark btn-sm rounded-circle position-absolute bottom-0 end-0 p-1"
                title="Upload Profile Picture"
                style={{ cursor: "pointer", width: "28px", height: "28px", lineHeight: "1" }}
              >
                <i className="bi bi-camera-fill small"></i>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              />
            </div>

            <div>
              <h4 className="fw-bold text-dark mb-1">{profile?.fullName || authUser?.fullName}</h4>
              <div className="small text-muted mb-2">
                Employee ID: <strong>{profile?.employeeId || authUser?.employeeId}</strong> | Corporate Email: <strong>{profile?.email}</strong>
              </div>
              <div>
                <span className="badge bg-primary me-2">{profile?.roleName}</span>
                <span className="badge bg-success">{profile?.status?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card card-erp">
        <div className="card-header py-2 bg-light border-bottom">
          <ul className="nav nav-tabs card-header-tabs rounded-0">
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-2 ${activeTab === "personal" ? "active fw-bold" : "text-secondary"}`}
                onClick={() => setActiveTab("personal")}
              >
                <i className="bi bi-person-lines-fill me-1"></i> Personal & Emergency Contact
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-0 small py-2 ${activeTab === "bank" ? "active fw-bold" : "text-secondary"}`}
                onClick={() => setActiveTab("bank")}
              >
                <i className="bi bi-bank me-1"></i> Bank Details & Tax Vault
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {/* Tab 1: Personal Details & Emergency Contact */}
          {activeTab === "personal" && (
            <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)}>
              <h6 className="fw-bold text-primary mb-3 border-bottom pb-2">PERSONAL DETAILS</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Full Name *</label>
                  <input
                    type="text"
                    className={`form-control ${personalForm.formState.errors.fullName ? "is-invalid" : ""}`}
                    {...personalForm.register("fullName")}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+1-555-0199"
                    {...personalForm.register("phone")}
                  />
                </div>

                {/* Date of Birth */}
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Date of Birth *</label>
                  <input
                    type="date"
                    className={`form-control ${personalForm.formState.errors.dateOfBirth ? "is-invalid" : ""}`}
                    {...personalForm.register("dateOfBirth")}
                  />
                  {personalForm.formState.errors.dateOfBirth && (
                    <div className="invalid-feedback">{personalForm.formState.errors.dateOfBirth.message}</div>
                  )}
                </div>

                {/* Place of Birth */}
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Place of Birth *</label>
                  <input
                    type="text"
                    className={`form-control ${personalForm.formState.errors.placeOfBirth ? "is-invalid" : ""}`}
                    placeholder="London"
                    {...personalForm.register("placeOfBirth")}
                  />
                  {personalForm.formState.errors.placeOfBirth && (
                    <div className="invalid-feedback">{personalForm.formState.errors.placeOfBirth.message}</div>
                  )}
                </div>

                {/* Accommodation Address */}
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Accommodation Address *</label>
                  <textarea
                    className={`form-control ${personalForm.formState.errors.accommodationAddress ? "is-invalid" : ""}`}
                    rows={2}
                    placeholder="Enter complete accommodation or housing address..."
                    {...personalForm.register("accommodationAddress")}
                  />
                  {personalForm.formState.errors.accommodationAddress && (
                    <div className="invalid-feedback">{personalForm.formState.errors.accommodationAddress.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Street Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="100 Corporate Blvd, Suite 400"
                    {...personalForm.register("street")}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold small">City</label>
                  <input type="text" className="form-control" placeholder="New York" {...personalForm.register("city")} />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold small">State / Province</label>
                  <input type="text" className="form-control" placeholder="NY" {...personalForm.register("state")} />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold small">Zip / Postal Code</label>
                  <input type="text" className="form-control" placeholder="10001" {...personalForm.register("zip")} />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold small">Country</label>
                  <input type="text" className="form-control" placeholder="United States" {...personalForm.register("country")} />
                </div>
              </div>

              <h6 className="fw-bold text-danger mb-3 border-bottom pb-2">EMERGENCY CONTACT INFORMATION</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold small">Contact Name</label>
                  <input type="text" className="form-control" placeholder="Jane Doe" {...personalForm.register("emergencyName")} />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Relationship</label>
                  <input type="text" className="form-control" placeholder="Spouse / Parent / Sibling" {...personalForm.register("emergencyRelationship")} />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Emergency Phone Number</label>
                  <input type="text" className="form-control" placeholder="+1-555-9988" {...personalForm.register("emergencyPhone")} />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-erp-danger" disabled={isSaving}>
                  {isSaving ? "SAVING..." : "SAVE PERSONAL PROFILE"}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Bank Details & Tax Vault */}
          {activeTab === "bank" && (
            <form onSubmit={bankTaxForm.handleSubmit(handleBankTaxSubmit)}>
              <h6 className="fw-bold text-primary mb-3 border-bottom pb-2">BANK & PAYROLL DISBURSEMENT DETAILS</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Bank Entity Name *</label>
                  <input
                    type="text"
                    className={`form-control ${bankTaxForm.formState.errors.bankName ? "is-invalid" : ""}`}
                    placeholder="e.g. JPMorgan Chase Bank"
                    {...bankTaxForm.register("bankName")}
                  />
                  {bankTaxForm.formState.errors.bankName && (
                    <div className="invalid-feedback">{bankTaxForm.formState.errors.bankName.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Bank Account Number *</label>
                  <input
                    type="text"
                    className={`form-control ${bankTaxForm.formState.errors.accountNumber ? "is-invalid" : ""}`}
                    placeholder="9988776655"
                    {...bankTaxForm.register("accountNumber")}
                  />
                  {bankTaxForm.formState.errors.accountNumber && (
                    <div className="invalid-feedback">{bankTaxForm.formState.errors.accountNumber.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">IBAN (International Bank Account Number) *</label>
                  <input
                    type="text"
                    className={`form-control ${bankTaxForm.formState.errors.iban ? "is-invalid" : ""}`}
                    placeholder="US33CHAS1002003004"
                    {...bankTaxForm.register("iban")}
                  />
                  {bankTaxForm.formState.errors.iban && (
                    <div className="invalid-feedback">{bankTaxForm.formState.errors.iban.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">SWIFT / BIC Code *</label>
                  <input
                    type="text"
                    className={`form-control ${bankTaxForm.formState.errors.swift ? "is-invalid" : ""}`}
                    placeholder="CHASUS33XXX"
                    {...bankTaxForm.register("swift")}
                  />
                  {bankTaxForm.formState.errors.swift && (
                    <div className="invalid-feedback">{bankTaxForm.formState.errors.swift.message}</div>
                  )}
                </div>
              </div>

              <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">TAX & COMPLIANCE REGISTRATION</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Tax Identification Number (TIN / SSN) (Optional)</label>
                  <input
                    type="text"
                    className={`form-control ${bankTaxForm.formState.errors.taxId ? "is-invalid" : ""}`}
                    placeholder="XXX-XX-6789"
                    {...bankTaxForm.register("taxId")}
                  />
                  {bankTaxForm.formState.errors.taxId && (
                    <div className="invalid-feedback">{bankTaxForm.formState.errors.taxId.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Tax Filing Category (Optional)</label>
                  <select className="form-select" {...bankTaxForm.register("taxCategory")}>
                    <option value="Standard Individual W-2">Standard Individual W-2</option>
                    <option value="1099 Contractor">1099 Contractor</option>
                    <option value="Expat Tax Exempt">Expat Tax Exempt</option>
                  </select>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-erp-danger" disabled={isSaving}>
                  {isSaving ? "SAVING..." : "SAVE BANK & TAX VAULT"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Employee PDF Documents Section */}
      {authUser?._id && (
        <EmployeeDocumentsSection
          userId={authUser._id}
          isEditable={authUser.roleName === "Employee" || authUser.roleName === "Super Admin"}
        />
      )}
    </div>
  );
}
