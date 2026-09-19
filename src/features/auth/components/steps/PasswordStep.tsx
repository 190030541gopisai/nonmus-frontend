import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { SignUpFormData } from "../../validation/signup.schema";
import PasswordRule from "../PasswordRule";

interface PasswordStepProps {
  goToNextStep: () => void;
}

function PasswordStep({ goToNextStep }: PasswordStepProps) {
  const {
    register,
    trigger,
    formState: { errors },
  } = useFormContext<SignUpFormData>();

  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const password =
    useWatch({
      name: "password",
    }) ?? "";

  const hasMinLength = password.length >= 8;

  const hasSpecialCharacter = /[^a-zA-Z0-9]/.test(password);

  const hasNumber = /\d/.test(password);

  const handleSignUp = async () => {
    setHasAttemptedSubmit(true);
    const isValid = await trigger(["password", "confirmPassword"]);
    if (!isValid) return;
    goToNextStep();
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            {...passwordField}
            onChange={(event) => {
              passwordField.onChange(event);

              if (hasAttemptedSubmit) {
                void trigger(["password", "confirmPassword"]);
              }
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
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <PasswordRule
          valid={hasMinLength}
          text="Password must be at least 8 characters"
        />

        <PasswordRule
          valid={hasSpecialCharacter}
          text="Password must contain a special character"
        />

        <PasswordRule valid={hasNumber} text="Password must contain a number" />
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
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            {...confirmPasswordField}
            onChange={(e) => {
              confirmPasswordField.onChange(e);

              if (hasAttemptedSubmit) {
                void trigger(["password", "confirmPassword"]);
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute inset-y-0 right-2 flex items-center text-sm text-gray-500"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        onClick={handleSignUp}
        className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        SignUp
      </button>
    </div>
  );
}

export default PasswordStep;
