import EmailStep from "../components/steps/signup/EmailStep";
import PasswordStep from "../components/steps/signup/PasswordStep";
import PersonalInfoStep from "../components/steps/signup/PersonalInfoStep";
import UsernameStep from "../components/steps/signup/UsernameStep";
import VerificationStep from "../components/steps/signup/VerificationStep";

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
