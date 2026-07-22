import { z } from "zod";

export const registrationSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First Name must be at least 2 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last Name must be at least 2 characters"),
    email: z
      .string()
      .trim()
      .email("Please enter a valid corporate email address"),
    phone: z
      .string()
      .trim()
      .min(8, "Mobile number must be at least 8 digits")
      .regex(/^[+0-9\s-]{8,20}$/, "Enter a valid phone number format"),
    country: z
      .string()
      .trim()
      .min(2, "Country is required"),
    roleName: z.enum(["Employee", "Project Manager", "General Manager"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    dateOfBirth: z.string().min(1, "Date of Birth is required"),
    placeOfBirth: z.string().trim().min(1, "Place of Birth is required"),
    accommodationAddress: z.string().trim().min(1, "Accommodation Address is required"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions to proceed",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
