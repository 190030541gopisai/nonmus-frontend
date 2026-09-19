import { useFormContext } from "react-hook-form";
import type { SignUpFormData } from "../../validation/signup.schema";
import { useState } from "react";

interface EmailStepProps {
  goToNextStep: () => void;
}

function EmailStep({ goToNextStep }: EmailStepProps) {
  const {
    register,
    trigger,
    formState: { errors },
  } = useFormContext<SignUpFormData>();

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const emailField = register("email");

  const handleSendingVerificationCode = async () => {
    setHasAttemptedSubmit(true);

    const isValid = await trigger(["email"]);

    if (!isValid) {
      return;
    }

    goToNextStep();
  };

  return (
    <div className="space-y-4">
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
      </div>

      <button
        onClick={handleSendingVerificationCode}
        className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Send Verification Code
      </button>
    </div>
  );
}

export default EmailStep;
