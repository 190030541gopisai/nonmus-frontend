import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import VerificationStep from "./VerificationStep";
import {
  SignUpSchema,
  type SignUpFormData,
} from "../../validation/signup.schema";
import { sendVerificationCode, verifyCode } from "../../api/authApi";

vi.mock("../../api/authApi", () => ({
  sendVerificationCode: vi.fn(),
  verifyCode: vi.fn(),
}));

const defaultTimings = {
  codeExpiryInSeconds: 300,
  resendInSeconds: 60,
};

function renderVerificationStep(
  props: Record<string, unknown> = {},
  formDefaults: Partial<SignUpFormData> = {},
) {
  const goToNextStep = vi.fn();
  const setVerificationTimings = vi.fn();

  function Wrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const methods = useForm<SignUpFormData>({
      resolver: zodResolver(SignUpSchema),
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "test@example.com",
        verificationCode: "",
        username: "",
        password: "",
        confirmPassword: "",
        ...formDefaults,
      },
      mode: "onSubmit",
    });
    return (
      <QueryClientProvider client={queryClient}>
        <FormProvider {...methods}>
          <VerificationStep
            goToNextStep={goToNextStep}
            verificationTimings={defaultTimings}
            setVerificationTimings={setVerificationTimings}
            {...props}
          />
        </FormProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(<Wrapper />),
    goToNextStep,
    setVerificationTimings,
  };
}

async function typeOtp(code: string) {
  const inputs = screen.getAllByRole("textbox");
  for (let i = 0; i < code.length; i++) {
    await userEvent.type(inputs[i], code[i]);
  }
}

describe("VerificationStep", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders email and six otp inputs", () => {
    renderVerificationStep();
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();
  });

  it("shows expiry countdown when code is not expired", () => {
    renderVerificationStep();
    expect(screen.getByText(/code expires in/i)).toBeInTheDocument();
  });

  it("shows expired message and disables verify when timings are zero", () => {
    renderVerificationStep({
      verificationTimings: { codeExpiryInSeconds: 0, resendInSeconds: 0 },
    });
    expect(screen.getByText(/code expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify/i })).toBeDisabled();
  });

  it("shows resend countdown when resend is not ready", () => {
    renderVerificationStep();
    expect(screen.getByText(/resend available in/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^resend$/i }),
    ).not.toBeInTheDocument();
  });

  it("shows resend button when resend countdown is zero", () => {
    renderVerificationStep({
      verificationTimings: { codeExpiryInSeconds: 300, resendInSeconds: 0 },
    });
    expect(screen.getByRole("button", { name: /^resend$/i })).toBeInTheDocument();
  });

  it("does not call verify API when code is empty", async () => {
    renderVerificationStep();
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/verification code must be exactly 6 digits/i),
      ).toBeInTheDocument();
    });
    expect(verifyCode).not.toHaveBeenCalled();
  });

  it("does not call verify API when code is incomplete", async () => {
    renderVerificationStep();
    await typeOtp("123");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/verification code must be exactly 6 digits/i),
      ).toBeInTheDocument();
    });
    expect(verifyCode).not.toHaveBeenCalled();
  });

  it("advances when verification succeeds", async () => {
    vi.mocked(verifyCode).mockResolvedValue({ verified: true });
    const { goToNextStep } = renderVerificationStep();
    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(verifyCode).toHaveBeenCalledWith("test@example.com", "123456");
      expect(goToNextStep).toHaveBeenCalled();
    });
  });

  it("shows invalid code message when verified is false", async () => {
    vi.mocked(verifyCode).mockResolvedValue({ verified: false });
    const { goToNextStep } = renderVerificationStep();
    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Invalid verification code."),
      ).toBeInTheDocument();
    });
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it("shows max attempts error and expires code", async () => {
    vi.mocked(verifyCode).mockRejectedValue({
      response: { data: { error: "VERIFY_ATTEMPTS_EXCEEDED" } },
    });
    renderVerificationStep();
    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/maximum verification attempts exceeded/i),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/code expired/i)).toBeInTheDocument();
    });
  });

  it("shows generic verification error on unknown failure", async () => {
    vi.mocked(verifyCode).mockRejectedValue({
      response: { data: { error: "UNKNOWN" } },
    });
    renderVerificationStep();
    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Verification failed. Try again."),
      ).toBeInTheDocument();
    });
  });

  it("disables verify button while request is pending", async () => {
    vi.mocked(verifyCode).mockImplementation(() => new Promise(() => {}));
    renderVerificationStep();
    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /verifying/i }),
      ).toBeDisabled();
    });
  });

  it("resends code, updates timings, and clears inputs", async () => {
    const timings = { codeExpiryInSeconds: 300, resendInSeconds: 60 };
    vi.mocked(sendVerificationCode).mockResolvedValue(timings);
    const { setVerificationTimings } = renderVerificationStep({
      verificationTimings: { codeExpiryInSeconds: 300, resendInSeconds: 0 },
    });
    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /^resend$/i }));
    await waitFor(() => {
      expect(sendVerificationCode).toHaveBeenCalledWith("test@example.com");
      expect(setVerificationTimings).toHaveBeenCalledWith(timings);
    });
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => expect(input).toHaveValue(""));
  });

  it("shows resend error on failure", async () => {
    vi.mocked(sendVerificationCode).mockRejectedValue(new Error("fail"));
    renderVerificationStep({
      verificationTimings: { codeExpiryInSeconds: 300, resendInSeconds: 0 },
    });
    await userEvent.click(screen.getByRole("button", { name: /^resend$/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Failed to resend. Try again."),
      ).toBeInTheDocument();
    });
  });

  it("hides resend button while resend is pending", async () => {
    vi.mocked(sendVerificationCode).mockImplementation(
      () => new Promise(() => {}),
    );
    renderVerificationStep({
      verificationTimings: { codeExpiryInSeconds: 300, resendInSeconds: 0 },
    });
    await userEvent.click(screen.getByRole("button", { name: /^resend$/i }));
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /^resend$/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("filters non-digits and auto-focuses next input", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0], "a1");
    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveFocus();
  });

  it("ignores letters-only input", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0], "abc");
    expect(inputs[0]).toHaveValue("");
    expect(inputs[0]).toHaveFocus();
  });

  it("replaces existing digit with newly typed digit", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0], "1");
    await userEvent.type(inputs[0], "2");
    expect(inputs[0]).toHaveValue("2");
  });

  it("moves focus left on Backspace of empty input", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0], "1");
    await userEvent.type(inputs[1], "{Backspace}");
    expect(inputs[0]).toHaveFocus();
  });

  it("moves focus with arrow keys", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    inputs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(inputs[1]).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(inputs[0]).toHaveFocus();
  });

  it("does not move left from first input or right from last", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    inputs[0].focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(inputs[0]).toHaveFocus();
    inputs[5].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(inputs[5]).toHaveFocus();
  });

  it("pastes a full code starting at first input", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.click(inputs[0]);
    await userEvent.paste("123456");
    inputs.forEach((input, i) => expect(input).toHaveValue(String(i + 1)));
  });

  it("pastes remaining digits from a later input", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0], "9");
    await userEvent.click(inputs[1]);
    await userEvent.paste("12345");
    expect(inputs[0]).toHaveValue("9");
    expect(inputs[1]).toHaveValue("1");
    expect(inputs[5]).toHaveValue("5");
  });

  it("ignores empty paste", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.click(inputs[0]);
    await userEvent.paste("");
    inputs.forEach((input) => expect(input).toHaveValue(""));
  });

  it("re-validates code on change after first submit", async () => {
    renderVerificationStep();
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/verification code must be exactly 6 digits/i),
      ).toBeInTheDocument();
    });
    await typeOtp("123456");
    await waitFor(() => {
      expect(
        screen.queryByText(/verification code must be exactly 6 digits/i),
      ).not.toBeInTheDocument();
    });
  });

  it("handles null verification timings", () => {
    renderVerificationStep({ verificationTimings: null });
    expect(screen.getByText(/code expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^resend$/i })).toBeInTheDocument();
  });

  it("does not advance focus from last input after typing", async () => {
    renderVerificationStep();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[5], "9");
    expect(inputs[5]).toHaveValue("9");
    expect(inputs[5]).toHaveFocus();
  });
});
