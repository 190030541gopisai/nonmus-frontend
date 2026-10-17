import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  forgotPasswordSendCode,
  type VerificationCodeResult,
} from "../../../api/authApi";
import { formatSeconds } from "../../../util/TimeUtils";
import {
  ForgotPasswordEmailSchema,
  type ForgotPasswordEmailFormData,
} from "../../../validation/forgotPassword.schema";

interface ForgotPasswordEmailStepProps {
  onSuccess: (email: string, timings: VerificationCodeResult) => void;
}

function ForgotPasswordEmailStep({ onSuccess }: ForgotPasswordEmailStepProps) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordEmailFormData>({
    resolver: zodResolver(ForgotPasswordEmailSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const email = watch("email") ?? "";

  const [emailCooldowns, setEmailCooldowns] = useState<Record<string, number>>(
    {},
  );

  // Decrement per-email resend cooldown every second so the button re-enables automatically
  useEffect(() => {
    const id = setInterval(() => {
      setEmailCooldowns((prev) => {
        const next = { ...prev };
        Object.entries(next).forEach(([k, s]) => {
          if (s <= 1) delete next[k];
          else next[k] = s - 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const { mutate: sendCode, isPending } = useMutation({
    mutationFn: (e: string) => forgotPasswordSendCode(e),
    onSuccess: (data, submittedEmail) => {
      onSuccess(submittedEmail, data);
    },
    onError: (error: unknown) => {
      const resp = (
        error as {
          response?: {
            data?: { error?: string; retryAfterSeconds?: number };
          };
        }
      ).response?.data;

      if (resp?.error === "RESEND_COOLDOWN_ACTIVE" && resp.retryAfterSeconds) {
        setEmailCooldowns((prev) => ({
          ...prev,
          [email]: resp.retryAfterSeconds!,
        }));
        return;
      }
      if (resp?.error === "RESEND_ATTEMPTS_EXCEEDED") {
        setError("email", {
          message: "Maximum attempts exceeded. Try again later.",
        });
        return;
      }
      if (resp?.error === "USER_NOT_FOUND") {
        setError("email", { message: "No account found for this email." });
        return;
      }
      if (
        (error as { code?: string }).code === "ERR_NETWORK" ||
        (error as { message?: string }).message === "Network Error"
      ) {
        setError("email", { message: "Network error. Check your connection." });
        return;
      }
      setError("email", { message: "Failed to send code. Try again." });
    },
  });

  const onSubmit = handleSubmit((data) => sendCode(data.email));

  const cooldown = emailCooldowns[email] ?? 0;
  const isCooldownActive = cooldown > 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we&apos;ll send a verification code.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
          {isCooldownActive && (
            <p className="text-sm text-red-500 mt-1">
              Resend in {formatSeconds(cooldown)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || isCooldownActive}
          className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Sending…" : "Send Verification Code"}
        </button>
      </form>
    </div>
  );
}

export default ForgotPasswordEmailStep;
