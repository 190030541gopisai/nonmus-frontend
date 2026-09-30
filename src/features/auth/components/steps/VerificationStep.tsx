import { useFormContext } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import type { SignUpFormData } from "../../validation/signup.schema";
import {
  useRef,
  useState,
  type ClipboardEvent,
} from "react";
import {
  verifyCode,
  sendVerificationCode,
  type VerificationCodeResult,
} from "../../api/authApi";
import useCountdown from "../../hooks/useCooldown";
import { formatSeconds } from "../../util/TimeUtils";

const MAX_OTP_LEN = 6;

interface VerificationStepProps {
  goToNextStep: () => void;
  verificationTimings: VerificationCodeResult | null;
  setVerificationTimings: (timings: VerificationCodeResult) => void;
}

function VerificationStep({
  goToNextStep,
  verificationTimings,
  setVerificationTimings,
}: VerificationStepProps) {
  const {
    setValue,
    trigger,
    getValues,
    setError,
    formState: { errors },
  } = useFormContext<SignUpFormData>();

  const [codes, setCodes] = useState<string[]>(["", "", "", "", "", ""]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { email } = getValues();

  const expiry = useCountdown(verificationTimings?.codeExpiryInSeconds ?? null);
  const resend = useCountdown(verificationTimings?.resendInSeconds ?? null);

  const { mutate: verify, isPending: isVerifying } = useMutation({
    mutationFn: () => verifyCode(email, getValues("verificationCode")),
    onSuccess: (data) => {
      if (data.verified) {
        goToNextStep();
      } else {
        setError("verificationCode", { message: "Invalid verification code." });
      }
    },
    onError: (error: unknown) => {
      const errorData = (
        error as { response?: { data?: { error?: string } } }
      ).response?.data;

      const errorType = errorData?.error;

      let errorMessage = "Verification failed. Try again.";

      if (errorType === "VERIFY_ATTEMPTS_EXCEEDED") {
        errorMessage = "Maximum verification attempts exceeded";
        expiry.reset(0);
      }

      setError("verificationCode", {
        message: errorMessage,
      });
    },
  });

  const { mutate: resendCode, isPending: isResending } = useMutation({
    mutationFn: () => sendVerificationCode(email),
    onSuccess: (data) => {
      setVerificationTimings(data);
      expiry.reset(data.codeExpiryInSeconds);
      resend.reset(data.resendInSeconds);

      clearVerificationCode();
    },
    onError: () => {
      setError("verificationCode", { message: "Failed to resend. Try again." });
    },
  });

  const clearVerificationCode = () => {
    const empty = ["", "", "", "", "", ""];
    setCodes(empty);
    setValue("verificationCode", "");
  };

  const handleVerify = async () => {
    setHasAttemptedSubmit(true);
    const valid = await trigger("verificationCode");
    if (!valid) return;
    verify();
  };

  const updateVerificationCode = (newCodes: string[]) => {
    setCodes(newCodes);
    const verificationCode = newCodes.join("").trim();
    setValue("verificationCode", verificationCode);
    if (hasAttemptedSubmit) {
      void trigger(["verificationCode"]);
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
    const digitsOnly = value.replace(/\D/g, "");
    const firstLetter = digitsOnly[0];
    const lastLetter = digitsOnly.slice(-1);
    const newCodes = [...codes];
    newCodes[index] =
      codes[index] === firstLetter ? lastLetter : (firstLetter ?? "");
    if (newCodes[index] === undefined) return;
    updateVerificationCode(newCodes);
    if (digitsOnly !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (
    index: number,
    e: ClipboardEvent<HTMLInputElement>,
  ): void => {
    e.preventDefault();
    const pastedCode = e.clipboardData.getData("text").slice(0, MAX_OTP_LEN);
    if (!pastedCode) return;
    const newCodes = [...codes];
    for (let i = index; i < MAX_OTP_LEN; i++) {
      newCodes[i] = pastedCode[i - index] ?? "";
    }
    updateVerificationCode(newCodes);
  };

  const codeExpired = expiry.remaining <= 0;
  const canResend = resend.remaining <= 0 && !isResending;

  return (
    <div className="space-y-4">
      <p>
        Enter six digit verification code sent to{" "}
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
            inputMode="numeric"
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

      {codeExpired ? (
        <p className="text-sm text-red-500">Code expired. Please resend.</p>
      ) : (
        <p className="text-sm text-gray-500">
          Code expires in{" "}
          <span className="font-medium">{formatSeconds(expiry.remaining)}</span>
        </p>
      )}

      <button
        onClick={handleVerify}
        disabled={isVerifying || codeExpired}
        className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isVerifying ? "Verifying…" : "Verify"}
      </button>

      <div className="text-sm">
        {canResend ? (
          <p>
            Didn&apos;t receive the code?{" "}
            <button
              onClick={() => resendCode()}
              disabled={isResending}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              {isResending ? "Resending…" : "Resend"}
            </button>
          </p>
        ) : (
          <p className="text-gray-500">
            Resend available in{" "}
            <span className="font-medium">
              {formatSeconds(resend.remaining)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default VerificationStep;
