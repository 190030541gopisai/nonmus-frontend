import { FormProvider, useForm } from "react-hook-form";
import { signUpSteps } from "../config/signUpSteps";
import useSignUpMultiStepForm from "../hooks/useSignUpMultiStepForm";
import SignUpLayout from "../layouts/SignupLayout";
import type { SignUpFormData } from "../validation/signup.schema";
import { SignUpSchema } from "../validation/signup.schema";
import { zodResolver } from "@hookform/resolvers/zod";

function SignUpPage() {
  const { currentStep, isFirstStep, goToNextStep, goToPreviousStep } =
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

  const CurrentStep = signUpSteps[currentStep].current;

  return (
    <FormProvider {...methods}>
      <SignUpLayout
        isFirstStep={isFirstStep}
        goToPreviousStep={goToPreviousStep}
      >
        <CurrentStep goToNextStep={goToNextStep} />
      </SignUpLayout>
    </FormProvider>
  );
}

export default SignUpPage;
