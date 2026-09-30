import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { SignUpFormData } from "../../validation/signup.schema";
import { checkUsernameAvailability } from "../../api/userApi";

interface UsernameStepProps {
  goToNextStep: () => void;
}

function UsernameStep({ goToNextStep }: UsernameStepProps) {
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
    control,
  } = useFormContext<SignUpFormData>();

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const username = useWatch({
    control,
    name: "username",
  });

  const usernameField = register("username");

  const callUsernameAvailabilityApi = async () => {
    setIsLoading(true);
    try {
      const result = await checkUsernameAvailability(getValues("username"));
      if (!result.available) {
        setApiError("Username is already taken.");
        return;
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setApiError("Too many requests. Please wait and try again.");
      } else if (status === 400) {
        const fieldError = err?.response?.data?.fieldErrors?.[0]?.message;
        setApiError(fieldError ?? "Invalid username.");
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // debouncing user availability check
  useEffect(() => {
    if (!username) return;

    const timeout = setTimeout(() => {
      callUsernameAvailabilityApi();
    }, 600);

    return () => clearTimeout(timeout);
  }, [username]);

  const handleContinue = async () => {
    setHasAttemptedSubmit(true);
    setApiError(null);

    const valid = await trigger("username");
    if (!valid) return;

    await callUsernameAvailabilityApi();

    if (!apiError) {
      goToNextStep();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...usernameField}
          onChange={(e) => {
            usernameField.onChange(e);
            setApiError(null);
            if (hasAttemptedSubmit) {
              void trigger("username");
            }
          }}
        />
        {errors.username && (
          <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
        )}
        {apiError && <p className="text-sm text-red-500 mt-1">{apiError}</p>}
      </div>

      <button
        onClick={handleContinue}
        disabled={isLoading}
        className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? "Checking..." : "Continue"}
      </button>
    </div>
  );
}

export default UsernameStep;
