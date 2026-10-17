import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import type { VerificationCodeResult } from "../api/authApi";
import { forgotPasswordSteps } from "../config/forgotPasswordSteps";
import useMultiStepForm from "../hooks/useMultiStepForm";
import ForgotPasswordEmailStep from "../components/steps/forgot-password/ForgotPasswordEmailStep";
import ForgotPasswordVerifyStep from "../components/steps/forgot-password/ForgotPasswordVerifyStep";
import ForgotPasswordResetStep from "../components/steps/forgot-password/ForgotPasswordResetStep";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { currentStep, isFirstStep, goToNextStep, goToPreviousStep, goToStep } =
    useMultiStepForm(forgotPasswordSteps);

  const [email, setEmail] = useState("");
  const [timings, setTimings] = useState<VerificationCodeResult | null>(null);

  const handleEmailSuccess = (
    submittedEmail: string,
    verificationTimings: VerificationCodeResult,
  ) => {
    setEmail(submittedEmail);
    setTimings(verificationTimings);
    goToNextStep();
  };

  const handleVerifySuccess = () => {
    goToNextStep();
  };

  const handleResetSuccess = () => {
    void navigate("/login");
  };

  const handleSessionExpired = () => {
    setTimings(null);
    goToStep("email");
  };

  const stepId = forgotPasswordSteps[currentStep].id;

  return (
    <div className="h-screen">
      <div className="p-8 space-y-4 h-full max-w-sm mx-auto">
        {!isFirstStep && (
          <BiArrowBack
            onClick={goToPreviousStep}
            className="h-6 w-6 cursor-pointer"
          />
        )}

        <div className="w-full">
          {stepId === "email" && (
            <ForgotPasswordEmailStep onSuccess={handleEmailSuccess} />
          )}

          {stepId === "verify" && timings && (
            <ForgotPasswordVerifyStep
              email={email}
              timings={timings}
              onSuccess={handleVerifySuccess}
            />
          )}

          {stepId === "reset" && (
            <ForgotPasswordResetStep
              onSuccess={handleResetSuccess}
              onSessionExpired={handleSessionExpired}
            />
          )}
        </div>

        <div className="w-full">
          <p className="text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
