import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, act } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import UsernameStep from "./UsernameStep";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SignUpSchema,
  type SignUpFormData,
} from "../../validation/signup.schema";
import { checkUsernameAvailability } from "../../api/userApi";

vi.mock("../../api/userApi", () => ({
  checkUsernameAvailability: vi.fn(),
}));

function renderUsernameStep(props = {}) {
  function Wrapper() {
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
      <FormProvider {...methods}>
        <UsernameStep goToNextStep={vi.fn()} {...props} />
      </FormProvider>
    );
  }
  return render(<Wrapper />);
}

describe("UsernameStep", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders username field and continue button", () => {
    renderUsernameStep();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();
  });

  it("does not call API or advance when username is empty", async () => {
    const goToNextStep = vi.fn();
    renderUsernameStep({ goToNextStep });
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Username must be at least 3 characters"),
      ).toBeInTheDocument();
    });
    expect(checkUsernameAvailability).not.toHaveBeenCalled();
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it("shows validation error when username is too short", async () => {
    const goToNextStep = vi.fn();
    renderUsernameStep({ goToNextStep });
    await userEvent.type(screen.getByLabelText(/username/i), "ab");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Username must be at least 3 characters"),
      ).toBeInTheDocument();
    });
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it("shows validation error when username exceeds 30 characters", async () => {
    const goToNextStep = vi.fn();
    renderUsernameStep({ goToNextStep });
    await userEvent.type(screen.getByLabelText(/username/i), "a".repeat(31));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Username cannot exceed 30 characters"),
      ).toBeInTheDocument();
    });
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it("debounces availability check after typing", async () => {
    vi.mocked(checkUsernameAvailability).mockResolvedValue({
      username: "ada",
      available: true,
    });
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    expect(checkUsernameAvailability).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(checkUsernameAvailability).toHaveBeenCalledWith("ada");
    });
  });

  it("cancels previous debounce when username changes again", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(checkUsernameAvailability).mockResolvedValue({
      username: "adalovelace",
      available: true,
    });
    renderUsernameStep();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByLabelText(/username/i), "ada");
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await user.type(screen.getByLabelText(/username/i), "lovelace");
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    await waitFor(() => {
      expect(checkUsernameAvailability).toHaveBeenCalledTimes(1);
      expect(checkUsernameAvailability).toHaveBeenCalledWith("adalovelace");
    });
  });

  it("shows error when username is already taken", async () => {
    vi.mocked(checkUsernameAvailability).mockResolvedValue({
      username: "ada",
      available: false,
    });
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(
        screen.getByText("Username is already taken."),
      ).toBeInTheDocument();
    });
  });

  it("shows too many requests error on 429", async () => {
    vi.mocked(checkUsernameAvailability).mockRejectedValue({
      response: { status: 429 },
    });
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(
        screen.getByText("Too many requests. Please wait and try again."),
      ).toBeInTheDocument();
    });
  });

  it("shows field error message on 400", async () => {
    vi.mocked(checkUsernameAvailability).mockRejectedValue({
      response: {
        status: 400,
        data: { fieldErrors: [{ message: "Username contains invalid chars" }] },
      },
    });
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(
        screen.getByText("Username contains invalid chars"),
      ).toBeInTheDocument();
    });
  });

  it("shows fallback invalid username on 400 without fieldErrors", async () => {
    vi.mocked(checkUsernameAvailability).mockRejectedValue({
      response: { status: 400, data: {} },
    });
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(screen.getByText("Invalid username.")).toBeInTheDocument();
    });
  });

  it("shows generic error on unknown failure", async () => {
    vi.mocked(checkUsernameAvailability).mockRejectedValue(new Error("boom"));
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("advances when username is available", async () => {
    vi.mocked(checkUsernameAvailability).mockResolvedValue({
      username: "ada",
      available: true,
    });
    const goToNextStep = vi.fn();
    renderUsernameStep({ goToNextStep });
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(goToNextStep).toHaveBeenCalled();
    });
  });

  it("does not advance when apiError is already set", async () => {
    vi.mocked(checkUsernameAvailability).mockResolvedValue({
      username: "ada",
      available: false,
    });
    const goToNextStep = vi.fn();
    renderUsernameStep({ goToNextStep });
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(
        screen.getByText("Username is already taken."),
      ).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(checkUsernameAvailability).toHaveBeenCalled();
    });
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it("disables button and shows Checking while request is pending", async () => {
    vi.mocked(checkUsernameAvailability).mockImplementation(
      () => new Promise(() => {}),
    );
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /checking/i }),
      ).toBeDisabled();
    });
  });

  it("clears apiError when username changes", async () => {
    vi.mocked(checkUsernameAvailability).mockResolvedValueOnce({
      username: "ada",
      available: false,
    });
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(
        screen.getByText("Username is already taken."),
      ).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(/username/i), "x");
    expect(
      screen.queryByText("Username is already taken."),
    ).not.toBeInTheDocument();
  });

  it("re-validates username on change after first submit attempt", async () => {
    renderUsernameStep();
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Username must be at least 3 characters"),
      ).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(/username/i), "ada");
    await waitFor(() => {
      expect(
        screen.queryByText("Username must be at least 3 characters"),
      ).not.toBeInTheDocument();
    });
  });

  it("does not re-validate on change before first submit", async () => {
    renderUsernameStep();
    await userEvent.type(screen.getByLabelText(/username/i), "ab");
    expect(
      screen.queryByText("Username must be at least 3 characters"),
    ).not.toBeInTheDocument();
  });
});
