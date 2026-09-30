import { useState } from "react";

type Step = {
  id: string;
  next: string | null;
  previous: string | null;
};

function useSignUpMultiStepForm(steps: readonly Step[]) {
  const [currentStep, setCurrentStep] = useState(0);

  let current = steps[currentStep];
  const isFirstStep = current.previous === null;
  const isLastStep = current.next === null;

  const goToNextStep = () => {
    if (isLastStep) {
      return;
    }

    const nextIndex = steps.findIndex((step) => step.id === current.next);

    if (nextIndex != -1) {
      setCurrentStep(nextIndex);
    }
  };

  const goToPreviousStep = () => {
    if (isFirstStep) {
      return;
    }

    const prevIndex = steps.findIndex((step) => step.id === current.previous);

    if (prevIndex != -1) {
      setCurrentStep(prevIndex);
    }
  };

  const goToStep = (id: string) => {
    const index = steps.findIndex((step) => step.id === id);
    if (index !== -1) {
      setCurrentStep(index);
    }
  };

  return {
    currentStep,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
}

export default useSignUpMultiStepForm;
