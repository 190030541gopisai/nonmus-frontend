import { z } from "zod";

export const LoginSchema = z.object({
  credential: z
    .string()
    .min(1, "Email / Username is required")
    .max(255, "Email / Username cannot exceed 255 characters"),

  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
