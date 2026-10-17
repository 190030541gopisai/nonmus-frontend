import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useWatch } from "react-hook-form";
import { resetPassword } from "../../../api/authApi";
import PasswordRule from "../../PasswordRule";
import {
  ForgotPasswordResetSchema,
  type ForgotPasswordResetFormData,
} from "../../../validation/forgotPassword.schema";

interface ForgotPasswordResetStepProps {
  onSuccess: () => void;
  onSessionExpired: () => void;
}

function ForgotPasswordResetStep({
  onSuccess,
  onSessionExpired,
}: ForgotPasswordResetStepProps) {
  const {
    register,
    handleSubmit,
    setError,
    trigger,
    control,
    formState: { errors },
  } = useForm<ForgotPasswordResetFormData>({
    resolver: zodResolver(ForgotPasswordResetSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const password = useWatch({ control, name: "password" }) ?? "";
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
  const hasNumber = /\d/.test(password);

  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");

  const { mutate: doReset, isPending } = useMutation({
    mutationFn: (data: ForgotPasswordResetFormData) =>
      resetPassword({
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    onSuccess,
    onError: (error: unknown) => {
      const data = (
        error as {
          response?: { data?: { error?: string; message?: string } };
        }
      ).response?.data;

      if (
        data?.error === "MISSING_COOKIE" ||
        data?.error === "INVALID_VERIFICATION_TOKEN"
      ) {
        onSessionExpired();
        return;
      }

      setError("root", {
        message: data?.message ?? "Password reset failed. Please try again.",
      });
    },
  });

  const onSubmit = handleSubmit(
    (data) => {
      setHasAttemptedSubmit(true);
      doReset(data);
    },
    () => setHasAttemptedSubmit(true),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Set new password</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              {...passwordField}
              onChange={(e) => {
                passwordField.onChange(e);
                if (hasAttemptedSubmit)
                  void trigger(["password", "confirmPassword"]);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-sm text-gray-500"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <PasswordRule
            valid={hasMinLength}
            text="Password must be at least 8 characters"
          />
          <PasswordRule
            valid={hasSpecialChar}
            text="Password must contain a special character"
          />
          <PasswordRule
            valid={hasNumber}
            text="Password must contain a number"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              id="confirmPassword"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              {...confirmPasswordField}
              onChange={(e) => {
                confirmPasswordField.onChange(e);
                if (hasAttemptedSubmit)
                  void trigger(["password", "confirmPassword"]);
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-sm text-gray-500"
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Resetting…" : "Reset Password"}
        </button>

        {errors.root && (
          <p className="text-sm text-red-500">{errors.root.message}</p>
        )}
      </form>
    </div>
  );
}

export default ForgotPasswordResetStep;
