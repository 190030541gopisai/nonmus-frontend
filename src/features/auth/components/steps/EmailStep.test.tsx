import { describe, expect, it, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import EmailStep from "./EmailStep";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  SignUpSchema,
  type SignUpFormData,
} from "../../validation/signup.schema";
import { sendVerificationCode } from "../../api/authApi";

vi.mock("../../api/authApi", () => ({
  sendVerificationCode: vi.fn(),
}));

function renderEmailStep(props = {}) {
  function Wrapper() {
    const queryClient = new QueryClient();
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
    return (
      <QueryClientProvider client={queryClient}>
        <FormProvider {...methods}>
          <EmailStep
            goToNextStep={vi.fn()}
            setVerificationTimings={vi.fn()}
            {...props}
          />
        </FormProvider>
      </QueryClientProvider>
    );
  }
  return render(<Wrapper />);
}

describe("EmailStep", () => {
  it("sends verification code and moves to next step", async () => {
    const timings = {
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    };
    const goToNextStep = vi.fn();
    const setVerificationTimings = vi.fn();
    vi.mocked(sendVerificationCode).mockResolvedValue(timings as never);
    renderEmailStep({ goToNextStep, setVerificationTimings });

    await userEvent.type(screen.getByRole("textbox"), "test@example.com");
    await userEvent.click(
      screen.getByRole("button", {
        name: /send verification code/i,
      }),
    );
    await waitFor(() => {
      expect(sendVerificationCode).toHaveBeenCalledWith("test@example.com");
    });
    await waitFor(() => {
      expect(goToNextStep).toHaveBeenCalled();
      expect(setVerificationTimings).toHaveBeenCalledWith(timings);
    });
  });

  it("shows an error when email is already registered", async () => {
    vi.mocked(sendVerificationCode).mockRejectedValue({
      response: {
        data: {
          error: "USER_ALREADY_EXISTS",
        },
      },
    });
    renderEmailStep();
    await userEvent.type(screen.getByRole("textbox"), "test@example.com");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText("Email already registered please login."),
      ).toBeInTheDocument();
    });
  });

  it("does not call API when email is empty", async () => {
    vi.mocked(sendVerificationCode).mockClear();
    renderEmailStep();
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(sendVerificationCode).not.toHaveBeenCalled();
    });
  });

  it("shows validation error for invalid email format", async () => {
    vi.mocked(sendVerificationCode).mockClear();
    renderEmailStep();
    await userEvent.type(screen.getByRole("textbox"), "not-an-email");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    });
    expect(sendVerificationCode).not.toHaveBeenCalled();
  });

  it("shows error when resend attempts exceeded", async () => {
    vi.mocked(sendVerificationCode).mockRejectedValue({
      response: {
        data: {
          error: "RESEND_ATTEMPTS_EXCEEDED",
        },
      },
    });
    renderEmailStep();
    await userEvent.type(screen.getByRole("textbox"), "test@example.com");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText(/maximum resend attempts exceeded/i),
      ).toBeInTheDocument();
    });
  });

  it("shows network error message on network failure", async () => {
    vi.mocked(sendVerificationCode).mockRejectedValue({
      code: "ERR_NETWORK",
    });
    renderEmailStep();
    await userEvent.type(screen.getByRole("textbox"), "test@example.com");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("shows generic error on unknown failure", async () => {
    vi.mocked(sendVerificationCode).mockRejectedValue(new Error("Unknown"));
    renderEmailStep();
    await userEvent.type(screen.getByRole("textbox"), "test@example.com");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText(/failed to send verification code/i),
      ).toBeInTheDocument();
    });
  });

  it("disables button and shows countdown on RESEND_COOLDOWN_ACTIVE", async () => {
    vi.mocked(sendVerificationCode).mockRejectedValue({
      response: {
        data: {
          error: "RESEND_COOLDOWN_ACTIVE",
          retryAfterSeconds: 30,
        },
      },
    });
    renderEmailStep();
    await userEvent.type(screen.getByRole("textbox"), "test@example.com");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/resend in/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /resend in/i })).toBeDisabled();
    });
  });

  it("shows session expired banner when sessionExpired is true", () => {
    renderEmailStep({ sessionExpired: true });
    expect(
      screen.getByText(/your email verification session has expired/i),
    ).toBeInTheDocument();
  });

  it("does not show session expired banner by default", () => {
    renderEmailStep();
    expect(
      screen.queryByText(/your email verification session has expired/i),
    ).not.toBeInTheDocument();
  });

  it("button is disabled while request is pending", async () => {
    vi.mocked(sendVerificationCode).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    renderEmailStep();
    await userEvent.type(screen.getByRole("textbox"), "test@example.com");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    });
  });

  it("countdown decrements and button re-enables when cooldown expires", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(sendVerificationCode).mockRejectedValue({
      response: {
        data: {
          error: "RESEND_COOLDOWN_ACTIVE",
          retryAfterSeconds: 2,
        },
      },
    });
    renderEmailStep();

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByRole("textbox"), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/resend in/i)).toBeInTheDocument();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send verification code/i }),
      ).not.toBeDisabled();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-validates email on change after first submit attempt", async () => {
    vi.mocked(sendVerificationCode).mockClear();
    renderEmailStep();
    // trigger validation with invalid email
    await userEvent.type(screen.getByRole("textbox"), "bad");
    await userEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    });
    // now fix the email — error should clear
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "good@example.com");
    await waitFor(() => {
      expect(
        screen.queryByText(/enter a valid email/i),
      ).not.toBeInTheDocument();
    });
  });
});
