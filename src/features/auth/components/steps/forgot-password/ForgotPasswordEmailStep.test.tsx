import { describe, expect, it, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ForgotPasswordEmailStep from "./ForgotPasswordEmailStep";
import { forgotPasswordSendCode } from "../../../api/authApi";

vi.mock("../../../api/authApi", () => ({
  forgotPasswordSendCode: vi.fn(),
}));

function renderEmailStep(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const defaultProps = {
    onSuccess: vi.fn(),
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <ForgotPasswordEmailStep {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
}

describe("ForgotPasswordEmailStep", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("renders email field and send button", () => {
    renderEmailStep();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send verification code/i }),
    ).toBeInTheDocument();
  });

  it("sends code and calls onSuccess when email is valid", async () => {
    const onSuccess = vi.fn();
    const timings = { codeExpiryInSeconds: 300, resendInSeconds: 60 };
    vi.mocked(forgotPasswordSendCode).mockResolvedValue(timings);

    renderEmailStep({ onSuccess });

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "user@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    await waitFor(() => {
      expect(forgotPasswordSendCode).toHaveBeenCalledWith("user@example.com");
      expect(onSuccess).toHaveBeenCalledWith("user@example.com", timings);
    });
  });

  it("shows validation error for invalid email format", async () => {
    renderEmailStep();

    await userEvent.type(screen.getByLabelText(/email/i), "invalid-email");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    // HTML5 validation prevents form submission for invalid emails
    expect(forgotPasswordSendCode).not.toHaveBeenCalled();
  });

  it("does not call API when email is empty", async () => {
    renderEmailStep();

    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    // HTML5 validation prevents empty email submission
    expect(forgotPasswordSendCode).not.toHaveBeenCalled();
  });

  it("shows error when user not found", async () => {
    vi.mocked(forgotPasswordSendCode).mockRejectedValue({
      response: { data: { error: "USER_NOT_FOUND" } },
    });

    renderEmailStep();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "notfound@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no account found for this email/i),
      ).toBeInTheDocument();
    });
  });

  it("shows cooldown message and disables button on RESEND_COOLDOWN_ACTIVE", async () => {
    vi.mocked(forgotPasswordSendCode).mockRejectedValue({
      response: {
        data: { error: "RESEND_COOLDOWN_ACTIVE", retryAfterSeconds: 30 },
      },
    });

    renderEmailStep();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "user@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/resend in/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /send verification code/i }),
    ).toBeDisabled();
  });

  it("shows max attempts exceeded error", async () => {
    vi.mocked(forgotPasswordSendCode).mockRejectedValue({
      response: { data: { error: "RESEND_ATTEMPTS_EXCEEDED" } },
    });

    renderEmailStep();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "user@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/maximum attempts exceeded/i),
      ).toBeInTheDocument();
    });
  });

  it("shows network error on network failure", async () => {
    vi.mocked(forgotPasswordSendCode).mockRejectedValue({
      code: "ERR_NETWORK",
    });

    renderEmailStep();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "user@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("shows generic error on unknown failure", async () => {
    vi.mocked(forgotPasswordSendCode).mockRejectedValue(new Error("boom"));

    renderEmailStep();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "user@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/failed to send code. try again/i),
      ).toBeInTheDocument();
    });
  });

  it("button is disabled while request is pending", async () => {
    vi.mocked(forgotPasswordSendCode).mockImplementation(
      () => new Promise(() => {}),
    );

    renderEmailStep();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "user@example.com",
    );

    const button = screen.getByRole("button", {
      name: /send verification code/i,
    });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/sending…/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it("countdown decrements and button re-enables when cooldown expires", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(forgotPasswordSendCode).mockRejectedValue({
      response: {
        data: { error: "RESEND_COOLDOWN_ACTIVE", retryAfterSeconds: 3 },
      },
    });

    renderEmailStep();

    await userEvent.type(
      screen.getByLabelText(/email/i),
      "user@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/resend in/i)).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText(/resend in/i)).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /send verification code/i }),
      ).not.toBeDisabled();
    });
  });
});
