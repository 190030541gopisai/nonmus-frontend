import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { SignUpFormData } from "../../validation/signup.schema";

function UsernameStep({ goToNextStep }) {
  const {
    register,
    trigger,
    formState: { errors },
  } = useFormContext<SignUpFormData>();

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const usernameField = register("username");

  const handleContinue = async () => {
    setHasAttemptedSubmit(true);
    const valid = await trigger("username");

    if (!valid) return;

    goToNextStep();
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

            if (hasAttemptedSubmit) {
              void trigger("username");
            }
          }}
        />
        {errors.username && (
          <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
        )}
      </div>

      <button
        onClick={handleContinue}
        className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Continue
      </button>
    </div>
  );
}

export default UsernameStep;
