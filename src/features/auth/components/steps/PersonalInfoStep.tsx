import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { SignUpFormData } from "../../validation/signup.schema";

interface PersonalInfoProps {
  goToNextStep: () => void;
}

function PersonalInfoStep({ goToNextStep }: PersonalInfoProps) {
  const {
    register,
    trigger,
    formState: { errors },
  } = useFormContext<SignUpFormData>();

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const firstNameField = register("firstName");
  const lastNameField = register("lastName");

  const handleNext = async () => {
    setHasAttemptedSubmit(true);
    const isValid = await trigger(["firstName", "lastName"]);

    if (!isValid) {
      return;
    }

    goToNextStep();
  };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
          Firstname <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="firstName"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...firstNameField}
          onChange={(e) => {
            firstNameField.onChange(e);

            if (hasAttemptedSubmit) {
              void trigger(["firstName"]);
            }
          }}
        />
        {errors.firstName && (
          <p className="text-sm text-red-500 mt-1">
            {errors.firstName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
          Lastname (Optional)
        </label>
        <input
          type="text"
          id="lastName"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...lastNameField}
          onChange={(e) => {
            lastNameField.onChange(e);

            if (hasAttemptedSubmit) {
              void trigger(["lastName"]);
            }
          }}
        />
        {errors.lastName && (
          <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
        )}
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Continue Signup
      </button>
    </div>
  );
}

export default PersonalInfoStep;
