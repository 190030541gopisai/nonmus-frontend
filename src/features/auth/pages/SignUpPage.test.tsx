import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "./SignUpPage";

const mocks = vi.hoisted(() => {
  const currentStep = vi.fn(
    (props: {
      onSessionExpired: () => void;
      setVerificationTimings: (timings: {
        codeExpiryInSeconds: number;
        resendInSeconds: number;
      }) => void;
      sessionExpired: boolean;
      verificationTimings: unknown;
    }) => (
      <div>
        <span>Current signup step</span>
        <span>{props.sessionExpired ? "Session expired" : "Session active"}</span>
        <span>{props.verificationTimings ? "Timings set" : "No timings"}</span>
        <button onClick={props.onSessionExpired}>Expire session</button>
        <button
          onClick={() =>
            props.setVerificationTimings({
              codeExpiryInSeconds: 300,
              resendInSeconds: 60,
            })
          }
        >
          Set timings
        </button>
      </div>
    ),
  );

  return {
    currentStep,
    goToStep: vi.fn(),
    goToNextStep: vi.fn(),
    goToPreviousStep: vi.fn(),
    useMultiStep: vi.fn(() => ({
      currentStep: 0,
      isFirstStep: true,
      goToNextStep: mocks.goToNextStep,
      goToPreviousStep: mocks.goToPreviousStep,
      goToStep: mocks.goToStep,
    })),
  };
});

vi.mock("../config/signUpSteps", () => ({
  signUpSteps: [
    {
      id: "personal-info",
      current: mocks.currentStep,
      next: "email",
      previous: null,
    },
  ],
}));

vi.mock("../hooks/useSignUpMultiStepForm", () => ({
  default: mocks.useMultiStep,
}));

vi.mock("../layouts/SignupLayout", () => ({
  default: (props: {
    isFirstStep: boolean;
    goToPreviousStep: () => void;
    children: React.ReactNode;
  }) => (
    <div>
      {!props.isFirstStep && (
        <button onClick={props.goToPreviousStep}>Back</button>
      )}
      {props.children}
    </div>
  ),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMultiStep.mockReturnValue({
      currentStep: 0,
      isFirstStep: true,
      goToNextStep: mocks.goToNextStep,
      goToPreviousStep: mocks.goToPreviousStep,
      goToStep: mocks.goToStep,
    });
  });

  it("renders current signup step", () => {
    render(<SignUpPage />);

    expect(screen.getByText("Current signup step")).toBeInTheDocument();
    expect(screen.getByText("Session active")).toBeInTheDocument();
    expect(screen.getByText("No timings")).toBeInTheDocument();
  });

  it("passes previous-step handler to layout when not first step", async () => {
    mocks.useMultiStep.mockReturnValue({
      currentStep: 0,
      isFirstStep: false,
      goToNextStep: mocks.goToNextStep,
      goToPreviousStep: mocks.goToPreviousStep,
      goToStep: mocks.goToStep,
    });

    render(<SignUpPage />);
    await userEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mocks.goToPreviousStep).toHaveBeenCalledTimes(1);
  });

  it("returns to email and clears timings when session expires", async () => {
    render(<SignUpPage />);

    await userEvent.click(screen.getByRole("button", { name: "Expire session" }));

    expect(mocks.goToStep).toHaveBeenCalledWith("email");
    expect(screen.getByText("Session expired")).toBeInTheDocument();
    expect(screen.getByText("No timings")).toBeInTheDocument();
  });

  it("sets verification timings and clears session-expired state", async () => {
    render(<SignUpPage />);

    await userEvent.click(screen.getByRole("button", { name: "Expire session" }));
    await userEvent.click(screen.getByRole("button", { name: "Set timings" }));

    expect(screen.getByText("Session active")).toBeInTheDocument();
    expect(screen.getByText("Timings set")).toBeInTheDocument();
  });
});
