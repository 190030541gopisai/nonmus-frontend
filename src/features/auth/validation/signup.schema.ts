import { z } from "zod";

export const SignUpSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name cannot exceed 50 characters"),
    lastName: z.string().max(50, "Last name cannot exceed 50 characters"),
    email: z
      .email("Enter a valid email address")
      .max(255, "Email cannot exceed 255 characters"),
    verificationCode: z
      .string()
      .length(6, "Verification code must be exactly 6 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password cannot exceed 64 characters")
      .regex(/\d/, "Password must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof SignUpSchema>;
