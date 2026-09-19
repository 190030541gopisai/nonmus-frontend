import { useFormContext } from "react-hook-form";
import type { SignUpFormData } from "../../validation/signup.schema";
import { useRef, useState, type ClipboardEvent } from "react";

const MAX_OTP_LEN = 6;

function VerificationStep({ goToNextStep }) {
  const {
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useFormContext<SignUpFormData>();

  const [codes, setCodes] = useState<string[]>(["", "", "", "", "", ""]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { email } = getValues();

  const handleVerify = async () => {
    setHasAttemptedSubmit(true);
    const valid = await trigger("verificationCode");

    if (!valid) return;

    goToNextStep();
  };

  const updateVerificationCode = (newCodes: string[]) => {
    setCodes(newCodes);

    const verificationCode = newCodes.join("").trim();
    setValue("verificationCode", verificationCode);

    if(hasAttemptedSubmit) {
      void trigger(["verificationCode"])
    }
  };

  const focusAtEnd = (index: number) => {
    const input = inputRefs.current[index];

    if (!input) return;

    input.focus();

    requestAnimationFrame(() => {
      const length = input.value.length;
      input.setSelectionRange(length, length);
    });
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      focusAtEnd(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusAtEnd(index - 1);
    } else if (e.key === "ArrowRight" && index < 5) {
      focusAtEnd(index + 1);
    }
  };

  const handleChange = (index: number, value: string) => {
    const firstLetter = value[0];
    const lastLetter = value.slice(-1);

    const newCodes = [...codes];

    if (codes[index] === firstLetter) {
      newCodes[index] = lastLetter;
    } else {
      newCodes[index] = firstLetter;
    }

    setCodes(newCodes);
    updateVerificationCode(newCodes);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (
    index: number,
    e: ClipboardEvent<HTMLInputElement>,
  ): void => {
    e.preventDefault();

    const pastedText = e.clipboardData.getData("text");

    const pastedCode = pastedText.slice(0, MAX_OTP_LEN);

    if (pastedCode === null) return;

    const newCodes = [...codes];

    for (let i = index; i < MAX_OTP_LEN; i++) {
      newCodes[i] = pastedCode[i - index];
    }

    setCodes(newCodes);
  };

  return (
    <div className="space-y-4">
      <p>
        Enter Six digit verification code sent to{" "}
        <span className="font-medium">{email}</span>
      </p>

      <div className="flex justify-between">
        {codes.map((code, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            value={code}
            className="w-8 h-10 text-center text-2xl border border-gray-300 bg-gray-100 rounded-none
              outline-none
              focus:border-gray-500
              focus:bg-white"
            onChange={(e) => handleChange(index, e.target.value)}
            onPaste={(e) => handlePaste(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
          />
        ))}
      </div>

      {errors.verificationCode && (
        <p className="text-sm text-red-500">
          {errors.verificationCode.message}
        </p>
      )}

      <p>Verification Code Expires in 10 min</p>

      <button
        onClick={handleVerify}
        className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Verify
      </button>

      <p>
        Not received email verification code ? <span>Resend</span>
      </p>
      <p>You can resend again in 1 min</p>
    </div>
  );
}

export default VerificationStep;
