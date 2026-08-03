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
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  placeOfBirth: z.string().trim().min(1, "Place of birth is required"),
  accommodationAddress: z.string().trim().min(1, "Accommodation address is required"),
});

export const bankTaxSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  taxId: z.string().optional(),
  taxCategory: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type BankTaxFormValues = z.infer<typeof bankTaxSchema>;
