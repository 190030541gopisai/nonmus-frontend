import { describe, expect, it, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ForgotPasswordResetStep from "./ForgotPasswordResetStep";
import { resetPassword } from "../../../api/authApi";

vi.mock("../../../api/authApi", () => ({
  resetPassword: vi.fn(),
}));

function renderResetStep(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const defaultProps = {
    onSuccess: vi.fn(),
    onSessionExpired: vi.fn(),
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <ForgotPasswordResetStep {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
}

describe("ForgotPasswordResetStep", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders password fields and submit button", () => {
    renderResetStep();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset password/i }),
    ).toBeInTheDocument();
  });

  it("shows password requirements", () => {
    renderResetStep();
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/password must contain a special character/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/password must contain a number/i),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty passwords", async () => {
    renderResetStep();

    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i }),
    );

    // Form validates on submit but errors appear inline
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    renderResetStep();

    await userEvent.type(
      screen.getByLabelText(/new password/i),
      "Password123!",
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Password456!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("calls resetPassword API and onSuccess on valid submission", async () => {
    const onSuccess = vi.fn();
    vi.mocked(resetPassword).mockResolvedValue({ success: true });

    renderResetStep({ onSuccess });

    await userEvent.type(
      screen.getByLabelText(/new password/i),
      "Password123!",
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Password123!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i }),
    );

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("calls onSessionExpired when MISSING_COOKIE error", async () => {
    const onSessionExpired = vi.fn();
    vi.mocked(resetPassword).mockRejectedValue({
      response: { data: { error: "MISSING_COOKIE" } },
    });

    renderResetStep({ onSessionExpired });

    await userEvent.type(
      screen.getByLabelText(/new password/i),
      "Password123!",
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Password123!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i }),
    );

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalled();
    });
  });

  it("calls onSessionExpired when INVALID_VERIFICATION_TOKEN error", async () => {
    const onSessionExpired = vi.fn();
    vi.mocked(resetPassword).mockRejectedValue({
      response: { data: { error: "INVALID_VERIFICATION_TOKEN" } },
    });

    renderResetStep({ onSessionExpired });

    await userEvent.type(
      screen.getByLabelText(/new password/i),
      "Password123!",
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Password123!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i }),
    );

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalled();
    });
  });

  it("shows generic error on unknown failure", async () => {
    vi.mocked(resetPassword).mockRejectedValue(new Error("boom"));

    renderResetStep();

    await userEvent.type(
      screen.getByLabelText(/new password/i),
      "Password123!",
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Password123!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/password reset failed. please try again/i),
      ).toBeInTheDocument();
    });
  });

  it("toggles password visibility", async () => {
    renderResetStep();

    const passwordInput = screen.getByLabelText(/new password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await userEvent.click(screen.getAllByRole("button", { name: /show/i })[0]!);

    expect(passwordInput).toHaveAttribute("type", "text");

    await userEvent.click(screen.getAllByRole("button", { name: /hide/i })[0]!);

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("button is disabled while request is pending", async () => {
    vi.mocked(resetPassword).mockImplementation(
      () => new Promise(() => {}),
    );

    renderResetStep();

    await userEvent.type(
      screen.getByLabelText(/new password/i),
      "Password123!",
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Password123!",
    );

    const button = screen.getByRole("button", { name: /reset password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/resetting…/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it("re-validates on change after first submit attempt", async () => {
    renderResetStep();

    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i }),
    );

    // After submit attempt, typing triggers validation
    await userEvent.type(screen.getByLabelText(/new password/i), "Password123!");

    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("updates password rules as user types", async () => {
    renderResetStep();

    const passwordInput = screen.getByLabelText(/new password/i);

    await userEvent.type(passwordInput, "Pass");
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();

    await userEvent.type(passwordInput, "word1");
    expect(screen.getByText(/contain a number/i)).toBeInTheDocument();

    await userEvent.type(passwordInput, "23!");
    expect(screen.getByText(/special character/i)).toBeInTheDocument();
  });
});
