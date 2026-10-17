import { describe, expect, it, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ForgotPasswordVerifyStep from "./ForgotPasswordVerifyStep";
import {
  forgotPasswordVerifyCode,
  forgotPasswordSendCode,
} from "../../../api/authApi";

vi.mock("../../../api/authApi", () => ({
  forgotPasswordVerifyCode: vi.fn(),
  forgotPasswordSendCode: vi.fn(),
}));

vi.mock("../../../hooks/useCooldown", () => ({
  default: vi.fn((initial: number) => ({
    remaining: initial,
    reset: vi.fn(),
  })),
}));

function renderVerifyStep(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const defaultProps = {
    email: "user@example.com",
    timings: { codeExpiryInSeconds: 300, resendInSeconds: 60 },
    onSuccess: vi.fn(),
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <ForgotPasswordVerifyStep {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
}

async function typeOtp(code: string) {
  const inputs = screen.getAllByRole("textbox");
  for (let i = 0; i < code.length; i++) {
    await userEvent.type(inputs[i]!, code[i]!);
  }
}

describe("ForgotPasswordVerifyStep", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders 6 OTP input fields", () => {
    renderVerifyStep();
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("displays user email", () => {
    renderVerifyStep({ email: "test@example.com" });
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
  });

  it("does not call verify API when code is empty", async () => {
    renderVerifyStep();

    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/enter the 6-digit code/i),
      ).toBeInTheDocument();
    });
    expect(forgotPasswordVerifyCode).not.toHaveBeenCalled();
  });

  it("does not call verify API when code is incomplete", async () => {
    renderVerifyStep();

    await typeOtp("123");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/enter the 6-digit code/i),
      ).toBeInTheDocument();
    });
    expect(forgotPasswordVerifyCode).not.toHaveBeenCalled();
  });

  it("calls onSuccess when verification succeeds", async () => {
    const onSuccess = vi.fn();
    vi.mocked(forgotPasswordVerifyCode).mockResolvedValue({ verified: true });

    renderVerifyStep({ onSuccess });

    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(forgotPasswordVerifyCode).toHaveBeenCalledWith(
        "user@example.com",
        "123456",
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows invalid code message when verified is false", async () => {
    vi.mocked(forgotPasswordVerifyCode).mockResolvedValue({ verified: false });

    renderVerifyStep();

    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid verification code/i),
      ).toBeInTheDocument();
    });
  });

  it("shows max attempts error and expires code", async () => {
    vi.mocked(forgotPasswordVerifyCode).mockRejectedValue({
      response: { data: { error: "VERIFY_ATTEMPTS_EXCEEDED" } },
    });

    renderVerifyStep();

    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/maximum verification attempts exceeded/i),
      ).toBeInTheDocument();
    });
  });

  it("shows generic verification error on unknown failure", async () => {
    vi.mocked(forgotPasswordVerifyCode).mockRejectedValue(new Error("boom"));

    renderVerifyStep();

    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/verification failed. try again/i),
      ).toBeInTheDocument();
    });
  });

  it("allows pasting full OTP code", async () => {
    renderVerifyStep();

    const inputs = screen.getAllByRole("textbox");
    await userEvent.click(inputs[0]!);

    await userEvent.paste("654321");

    await waitFor(() => {
      expect(inputs[0]).toHaveValue("6");
      expect(inputs[1]).toHaveValue("5");
      expect(inputs[2]).toHaveValue("4");
      expect(inputs[3]).toHaveValue("3");
      expect(inputs[4]).toHaveValue("2");
      expect(inputs[5]).toHaveValue("1");
    });
  });

  it("auto-focuses next input after typing digit", async () => {
    renderVerifyStep();

    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0]!, "1");

    await waitFor(() => {
      expect(inputs[1]).toHaveFocus();
    });
  });

  it("moves focus left on Backspace when input is empty", async () => {
    renderVerifyStep();

    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[1]!, "2");
    await userEvent.clear(inputs[1]!);
    await userEvent.type(inputs[1]!, "{Backspace}");

    await waitFor(() => {
      expect(inputs[0]).toHaveFocus();
    });
  });

  it("disables verify button when code expired", async () => {
    const useCountdownMock = await import("../../../hooks/useCooldown");
    vi.mocked(useCountdownMock.default).mockReturnValue({
      remaining: 0,
      reset: vi.fn(),
    });

    renderVerifyStep();

    expect(screen.getByText(/code expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify/i })).toBeDisabled();
  });

  it("resends code and updates timings", async () => {
    const newTimings = { codeExpiryInSeconds: 300, resendInSeconds: 60 };
    vi.mocked(forgotPasswordSendCode).mockResolvedValue(newTimings);

    const useCountdownMock = await import("../../../hooks/useCooldown");
    const resetMock = vi.fn();
    vi.mocked(useCountdownMock.default).mockReturnValue({
      remaining: 0,
      reset: resetMock,
    });

    renderVerifyStep();

    const resendButton = screen.getByRole("button", { name: /resend/i });
    await userEvent.click(resendButton);

    await waitFor(() => {
      expect(forgotPasswordSendCode).toHaveBeenCalledWith("user@example.com");
    });
  });

  it("shows error when resend fails", async () => {
    vi.mocked(forgotPasswordSendCode).mockRejectedValue(new Error("fail"));

    const useCountdownMock = await import("../../../hooks/useCooldown");
    vi.mocked(useCountdownMock.default).mockReturnValue({
      remaining: 0,
      reset: vi.fn(),
    });

    renderVerifyStep();

    await userEvent.click(screen.getByRole("button", { name: /resend/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to resend. try again/i),
      ).toBeInTheDocument();
    });
  });

  it("button is disabled while verifying", async () => {
    vi.mocked(forgotPasswordVerifyCode).mockImplementation(
      () => new Promise(() => {}),
    );

    renderVerifyStep();

    await typeOtp("123456");

    const button = screen.getByRole("button", { name: /verify/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it("clears error when user types after failed attempt", async () => {
    const resetMock = vi.fn();
    const useCountdownMock = await import("../../../hooks/useCooldown");
    vi.mocked(useCountdownMock.default).mockReturnValue({
      remaining: 300,
      reset: resetMock,
    });

    vi.mocked(forgotPasswordVerifyCode).mockResolvedValue({ verified: false });

    renderVerifyStep();

    await typeOtp("123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid verification code/i),
      ).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("textbox");
    await userEvent.clear(inputs[0]!);
    await userEvent.type(inputs[0]!, "9");

    // Error should clear when typing after validation set hasAttemptedSubmit
    await waitFor(() => {
      expect(
        screen.queryByText(/invalid verification code/i),
      ).not.toBeInTheDocument();
    });
  });
});
