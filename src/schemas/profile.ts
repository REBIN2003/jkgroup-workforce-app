import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const bankTaxSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(4, "Account number is required"),
  iban: z.string().min(6, "Valid IBAN is required"),
  swift: z.string().min(4, "Valid SWIFT/BIC code is required"),
  taxId: z.string().min(2, "Tax ID is required"),
  taxCategory: z.string().min(1, "Tax category is required"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type BankTaxFormValues = z.infer<typeof bankTaxSchema>;
