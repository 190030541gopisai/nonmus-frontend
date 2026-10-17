import { useRef, useState, type ClipboardEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  forgotPasswordSendCode,
  forgotPasswordVerifyCode,
  type VerificationCodeResult,
} from "../../../api/authApi";
import useCountdown from "../../../hooks/useCooldown";
import { formatSeconds } from "../../../util/TimeUtils";

const MAX_OTP_LEN = 6;
const EMPTY_CODES = Array<string>(MAX_OTP_LEN).fill("");

interface ForgotPasswordVerifyStepProps {
  email: string;
  timings: VerificationCodeResult;
  onSuccess: () => void;
}

function ForgotPasswordVerifyStep({
  email,
  timings,
  onSuccess,
}: ForgotPasswordVerifyStepProps) {
  const [codes, setCodes] = useState<string[]>([...EMPTY_CODES]);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const expiry = useCountdown(timings.codeExpiryInSeconds);
  const resend = useCountdown(timings.resendInSeconds);

  const codeValue = codes.join("");

  const { mutate: verify, isPending: isVerifying } = useMutation({
    mutationFn: () => forgotPasswordVerifyCode(email, codeValue),
    onSuccess: (data) => {
      if (data.verified) {
        onSuccess();
      } else {
        setError("Invalid verification code.");
      }
    },
    onError: (err: unknown) => {
      const errType = (
        err as { response?: { data?: { error?: string } } }
      ).response?.data?.error;

      if (errType === "VERIFY_ATTEMPTS_EXCEEDED") {
        setError("Maximum verification attempts exceeded.");
        expiry.reset(0);
      } else {
        setError("Verification failed. Try again.");
      }
    },
  });

  const { mutate: resendCode, isPending: isResending } = useMutation({
    mutationFn: () => forgotPasswordSendCode(email),
    onSuccess: (data) => {
      expiry.reset(data.codeExpiryInSeconds);
      resend.reset(data.resendInSeconds);
      setCodes([...EMPTY_CODES]);
      setError(null);
    },
    onError: () => {
      setError("Failed to resend. Try again.");
    },
  });

  const handleVerify = () => {
    setHasAttemptedSubmit(true);
    if (codeValue.length !== MAX_OTP_LEN || !/^\d{6}$/.test(codeValue)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setError(null);
    verify();
  };

  const focusAtEnd = (index: number) => {
    const input = inputRefs.current[index];
    if (!input) return;
    input.focus();
    requestAnimationFrame(() => {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    });
  };

  const updateCodes = (newCodes: string[]) => {
    setCodes(newCodes);
    if (hasAttemptedSubmit) setError(null);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !codes[index] && index > 0)
      focusAtEnd(index - 1);
    else if (e.key === "ArrowLeft" && index > 0) focusAtEnd(index - 1);
    else if (e.key === "ArrowRight" && index < MAX_OTP_LEN - 1)
      focusAtEnd(index + 1);
  };

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    const first = digits[0];
    const last = digits.slice(-1);
    const newCodes = [...codes];
    newCodes[index] = codes[index] === first ? last : (first ?? "");
    if (newCodes[index] === undefined) return;
    updateCodes(newCodes);
    if (digits !== "" && index < MAX_OTP_LEN - 1)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (
    index: number,
    e: ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, MAX_OTP_LEN);
    if (!pasted) return;
    const newCodes = [...codes];
    for (let i = index; i < MAX_OTP_LEN; i++) {
      newCodes[i] = pasted[i - index] ?? "";
    }
    updateCodes(newCodes);
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
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            value={code}
            className="w-8 h-10 text-center text-2xl border border-gray-300 bg-gray-100 rounded-none outline-none focus:border-gray-500 focus:bg-white"
            onChange={(e) => handleChange(index, e.target.value)}
            onPaste={(e) => handlePaste(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

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
            <span className="font-medium">{formatSeconds(resend.remaining)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordVerifyStep;
