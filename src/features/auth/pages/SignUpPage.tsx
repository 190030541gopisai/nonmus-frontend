import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { signUpSteps } from "../config/signUpSteps";
import useSignUpMultiStepForm from "../hooks/useSignUpMultiStepForm";
import SignUpLayout from "../layouts/SignupLayout";
import type { SignUpFormData } from "../validation/signup.schema";
import { SignUpSchema } from "../validation/signup.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { VerificationCodeResult } from "../api/authApi";

function SignUpPage() {
  const { currentStep, isFirstStep, goToNextStep, goToPreviousStep, goToStep } =
    useSignUpMultiStepForm(signUpSteps);
  const methods = useForm<SignUpFormData>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      verificationCode: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const [verificationTimings, setVerificationTimings] =
    useState<VerificationCodeResult | null>(null);

  const [sessionExpired, setSessionExpired] = useState(false);

  const handleSessionExpired = () => {
    setSessionExpired(true);
    setVerificationTimings(null);
    goToStep("email");
  };

  const handleSetVerificationTimings = (timings: VerificationCodeResult) => {
    setSessionExpired(false);
    setVerificationTimings(timings);
  };

  const CurrentStep = signUpSteps[currentStep].current;

  return (
    <FormProvider {...methods}>
      <SignUpLayout
        isFirstStep={isFirstStep}
        goToPreviousStep={goToPreviousStep}
      >
        <CurrentStep
          goToNextStep={goToNextStep}
          verificationTimings={verificationTimings}
          setVerificationTimings={handleSetVerificationTimings}
          sessionExpired={sessionExpired}
          onSessionExpired={handleSessionExpired}
        />
      </SignUpLayout>
    </FormProvider>
  );
}

export default SignUpPage;
