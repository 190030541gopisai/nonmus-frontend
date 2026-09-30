import { describe, expect, it } from "vitest";
import { signUpSteps } from "./signUpSteps";
import EmailStep from "../components/steps/EmailStep";
import PasswordStep from "../components/steps/PasswordStep";
import PersonalInfoStep from "../components/steps/PersonalInfoStep";
import UsernameStep from "../components/steps/UsernameStep";
import VerificationStep from "../components/steps/VerificationStep";

describe("signUpSteps", () => {
  it("contains signup steps in the expected order", () => {
    expect(signUpSteps.map(({ id }) => id)).toEqual([
      "personal-info",
      "email",
      "verification",
      "username",
      "password",
    ]);
  });

  it("maps each step to its component", () => {
    expect(signUpSteps.map(({ current }) => current)).toEqual([
      PersonalInfoStep,
      EmailStep,
      VerificationStep,
      UsernameStep,
      PasswordStep,
    ]);
  });

  it("links each step to previous and next steps", () => {
    expect(
      signUpSteps.map(({ id, next, previous }) => ({ id, next, previous })),
    ).toEqual([
      { id: "personal-info", next: "email", previous: null },
      { id: "email", next: "verification", previous: "personal-info" },
      { id: "verification", next: "username", previous: "email" },
      { id: "username", next: "password", previous: "verification" },
      { id: "password", next: null, previous: "username" },
    ]);
  });
});
