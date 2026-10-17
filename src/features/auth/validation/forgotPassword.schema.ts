import { z } from "zod";

export const ForgotPasswordEmailSchema = z.object({
  email: z
    .email("Enter a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
});

export type ForgotPasswordEmailFormData = z.infer<
  typeof ForgotPasswordEmailSchema
>;

export const ForgotPasswordResetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password cannot exceed 64 characters")
      .regex(/\d/, "Password must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordResetFormData = z.infer<
  typeof ForgotPasswordResetSchema
>;
