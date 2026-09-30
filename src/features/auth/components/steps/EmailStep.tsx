import { useFormContext, useWatch } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import type { SignUpFormData } from "../../validation/signup.schema";
import { useEffect, useState } from "react";
import {
  sendVerificationCode,
  type VerificationCodeResult,
} from "../../api/authApi";
import { formatSeconds } from "../../util/TimeUtils";

interface EmailStepProps {
  goToNextStep: () => void;
  setVerificationTimings: (timings: VerificationCodeResult) => void;
  sessionExpired?: boolean;
}

function EmailStep({
  goToNextStep,
  setVerificationTimings,
  sessionExpired,
}: EmailStepProps) {
  const {
    register,
    trigger,
    getValues,
    setError,
    control,
    formState: { errors },
  } = useFormContext<SignUpFormData>();

  const email = useWatch({ control, name: "email" });

  const [emailCooldowns, setEmailCooldowns] = useState<Record<string, number>>(
    {},
  );

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const emailField = register("email");

  const { mutate: sendCode, isPending } = useMutation({
    mutationFn: (email: string) => sendVerificationCode(email),
    onSuccess: (data) => {
      setVerificationTimings(data);
      goToNextStep();
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { error?: string; retryAfterSeconds?: number } };
      };
      const data = axiosError?.response?.data;

      let errorMessage = "Failed to send verification code. Try again.";
      if (data) {
        const errorType = data.error;
        if (errorType === "RESEND_COOLDOWN_ACTIVE") {
          const retryAfterSeconds = data.retryAfterSeconds;
          if (retryAfterSeconds) {
            setEmailCooldowns((prev) => ({
              ...prev,
              [email]: retryAfterSeconds,
            }));
          }
          return;
        } else if (errorType === "RESEND_ATTEMPTS_EXCEEDED") {
          errorMessage =
            "Maximum resend attempts exceeded. Retry after some time";
        } else if (errorType === "USER_ALREADY_EXISTS") {
          errorMessage = "Email already registered please login.";
        }
      } else if (
        (error as { code?: string }).code === "ERR_NETWORK" ||
        (error as { message?: string }).message === "Network Error"
      ) {
        errorMessage = "Network error. Check your connection and try again.";
      }

      setError("email", {
        message: errorMessage,
      });
    },
  });

  const handleSendingVerificationCode = async () => {
    setHasAttemptedSubmit(true);

    const isValid = await trigger(["email"]);
    if (!isValid) return;

    sendCode(getValues("email"));
  };

  const cooldown: number = emailCooldowns[email] ?? 0;
  const isCoolDownActive: boolean = cooldown > 0;

  // decrement per email resend retryAfterSeconds
  useEffect(() => {
    const interval = setInterval(() => {
      setEmailCooldowns((prev) => {
        const next = { ...prev };

        Object.entries(next).forEach(([key, seconds]) => {
          if (seconds <= 1) {
            delete next[key];
          } else {
            next[key] = seconds - 1;
          }
        });

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {sessionExpired && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Your email verification session has expired. Please request a new
          verification code to continue.
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...emailField}
          onChange={(e) => {
            emailField.onChange(e);

            if (hasAttemptedSubmit) {
              void trigger(["email"]);
            }
          }}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
        {isCoolDownActive && (
          <p className="text-sm text-red-500 mt-1">Resend cooldown active</p>
        )}
      </div>

      <button
        onClick={handleSendingVerificationCode}
        disabled={isPending || isCoolDownActive}
        className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Sending…"
          : isCoolDownActive
            ? `Resend in ${formatSeconds(cooldown)}`
            : "Send Verification Code"}
      </button>
    </div>
  );
}

export default EmailStep;
