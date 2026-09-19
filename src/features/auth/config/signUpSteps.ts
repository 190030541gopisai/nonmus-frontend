import EmailStep from "../components/steps/EmailStep";
import PasswordStep from "../components/steps/PasswordStep";
import PersonalInfoStep from "../components/steps/PersonalInfoStep";
import UsernameStep from "../components/steps/UsernameStep";
import VerificationStep from "../components/steps/VerificationStep";

export const signUpSteps = [
  {
    id: "personal-info",
    current: PersonalInfoStep,
    next: "email",
    previous: null,
  },
  {
    id: "email",
    current: EmailStep,
    next: "verification",
    previous: "personal-info",
  },
  {
    id: "verification",
    current: VerificationStep,
    next: "username",
    previous: "email",
  },
  {
    id: "username",
    current: UsernameStep,
    next: "password",
    previous: "verification",
  },
  {
    id: "password",
    current: PasswordStep,
    next: null,
    previous: "username",
  },
] as const;
