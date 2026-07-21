import { z } from "zod";

export const passwordLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid corporate email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const otpRequestSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid corporate email address"),
});

export const otpLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid corporate email address"),
  otpCode: z.string().length(6, "OTP code must be exactly 6 digits"),
});

export const resetPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid corporate email address"),
  otpCode: z.string().length(6, "OTP code must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type PasswordLoginFormValues = z.infer<typeof passwordLoginSchema>;
export type OtpRequestFormValues = z.infer<typeof otpRequestSchema>;
export type OtpLoginFormValues = z.infer<typeof otpLoginSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
