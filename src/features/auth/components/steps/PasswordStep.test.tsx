import { beforeEach, describe, expect, it, vi } from "vitest";
import PasswordStep from "./PasswordStep";
import { FormProvider, useForm } from "react-hook-form";
import { render, screen, waitFor } from "@testing-library/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SignUpSchema,
  type SignUpFormData,
} from "../../validation/signup.schema";
import userEvent from "@testing-library/user-event";
import { signUp } from "../../api/authApi";

const mockNavigate = vi.fn();

vi.mock("../../api/authApi", () => ({
  signUp: vi.fn(),
}));

const mockSignUp = vi.mocked(signUp);

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPasswordStep(props = {}) {
  function Wrapper() {
    const goToNextStep = vi.fn();
    const onSessionExpired = vi.fn();

    const methods = useForm<SignUpFormData>({
      resolver: zodResolver(SignUpSchema),
      defaultValues: {
        firstName: "Test",
        lastName: "K",
        email: "test-user@example.com",
        verificationCode: "123456",
        username: "test123",
        password: "",
        confirmPassword: "",
      },
      mode: "onSubmit",
    });

    return (
      <FormProvider {...methods}>
        <PasswordStep
          goToNextStep={goToNextStep}
          onSessionExpired={onSessionExpired}
          {...props}
        />
      </FormProvider>
    );
  }

  return render(<Wrapper />);
}

describe("PasswordStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders password and confirm password fields", () => {
    renderPasswordStep();

    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SignUp" })).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    renderPasswordStep();

    const passwordInput = screen.getByLabelText(/^Password/);

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getAllByRole("button", { name: "Show" })[0]);

    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getAllByRole("button", { name: "Hide" })[0]);

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("toggles confirm password visibility", async () => {
    const user = userEvent.setup();

    renderPasswordStep();

    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);

    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    await user.click(screen.getAllByRole("button", { name: "Show" })[1]);

    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    await user.click(screen.getAllByRole("button", { name: "Hide" })[1]);

    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("updates password rules when the user types", async () => {
    const user = userEvent.setup();

    renderPasswordStep();

    const passwordInput = screen.getByLabelText(/^Password/);

    await user.type(passwordInput, "abc");

    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();

    await user.clear(passwordInput);
    await user.type(passwordInput, "Abcdefg1!");

    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Password must contain a number"),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty passwords", async () => {
    const user = userEvent.setup();

    renderPasswordStep();

    await user.click(screen.getByRole("button", { name: "SignUp" }));

    expect(
      await screen.findByText("Password must be at least 8 characters", {
        selector: "p",
      }),
    ).toBeInTheDocument();

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signup API and navigates to home on success", async () => {
    const user = userEvent.setup();

    mockSignUp.mockResolvedValueOnce({} as Awaited<ReturnType<typeof signUp>>);

    renderPasswordStep();

    await user.type(screen.getByLabelText(/^Password/), "Abcdefg1!");
    await user.type(screen.getByLabelText(/^Confirm Password/), "Abcdefg1!");

    await user.click(screen.getByRole("button", { name: "SignUp" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        firstName: "Test",
        lastName: "K",
        username: "test123",
        password: "Abcdefg1!",
        confirmPassword: "Abcdefg1!",
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("calls onSessionExpired when Missing cookie", async () => {
    const user = userEvent.setup();

    mockSignUp.mockRejectedValue({
      response: {
        data: {
          error: "MISSING_COOKIE",
        },
      },
    });

    const onSessionExpired = vi.fn();

    renderPasswordStep({ onSessionExpired });

    await user.type(screen.getByLabelText(/^Password/), "Abcdefg1!");
    await user.type(screen.getByLabelText(/^Confirm Password/), "Abcdefg1!");

    await user.click(screen.getByRole("button", { name: "SignUp" }));

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onSessionExpired when Invalid Verification cookie", async () => {
    const user = userEvent.setup();

    mockSignUp.mockRejectedValue({
      response: {
        data: {
          error: "INVALID_VERIFICATION_TOKEN",
        },
      },
    });

    const onSessionExpired = vi.fn();

    renderPasswordStep({ onSessionExpired });

    await user.type(screen.getByLabelText(/^Password/), "Abcdefg1!");
    await user.type(screen.getByLabelText(/^Confirm Password/), "Abcdefg1!");

    await user.click(screen.getByRole("button", { name: "SignUp" }));

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1);
    });
  });

  it("Sign up failed due to unknown error", async () => {
    const user = userEvent.setup();

    mockSignUp.mockRejectedValue({
      response: {
        data: {
          message: "Sign up failed. Please try again.",
        },
      },
    });

    renderPasswordStep();

    await user.type(screen.getByLabelText(/^Password/), "Abcdefg1!");
    await user.type(screen.getByLabelText(/^Confirm Password/), "Abcdefg1!");

    await user.click(screen.getByRole("button", { name: "SignUp" }));

    expect(
      screen.getByText("Sign up failed. Please try again."),
    ).toBeInTheDocument();
  });

  it("revalidates password fields when password changes after submission", async () => {
    const user = userEvent.setup();

    renderPasswordStep();

    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/i);

    await user.click(screen.getByRole("button", { name: "SignUp" }));

    await user.type(passwordInput, "Abcdefg1!");
    await user.type(confirmPasswordInput, "Abcdefg1!");

    await waitFor(() => {
      expect(
        screen.queryByText(/passwords do not match/i, { selector: "p" }),
      ).not.toBeInTheDocument();
    });
  });
});
