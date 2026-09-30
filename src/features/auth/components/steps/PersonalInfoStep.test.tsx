import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import PersonalInfoStep from "./PersonalInfoStep";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SignUpSchema,
  type SignUpFormData,
} from "../../validation/signup.schema";

function renderPersonalInfoStep(props = {}) {
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
        <PersonalInfoStep goToNextStep={vi.fn()} {...props} />
      </FormProvider>
    );
  }
  return render(<Wrapper />);
}

describe("PersonalInfoStep", () => {
  it("renders first name, last name, and continue button", () => {
    renderPersonalInfoStep();
    expect(screen.getByLabelText(/firstname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lastname/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue signup/i }),
    ).toBeInTheDocument();
  });

  it("does not advance when first name is empty", async () => {
    const goToNextStep = vi.fn();
    renderPersonalInfoStep({ goToNextStep });
    await userEvent.click(
      screen.getByRole("button", { name: /continue signup/i }),
    );
    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
    });
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it("advances when first name is valid and last name is empty", async () => {
    const goToNextStep = vi.fn();
    renderPersonalInfoStep({ goToNextStep });
    await userEvent.type(screen.getByLabelText(/firstname/i), "Ada");
    await userEvent.click(
      screen.getByRole("button", { name: /continue signup/i }),
    );
    await waitFor(() => {
      expect(goToNextStep).toHaveBeenCalled();
    });
  });

  it("advances when both names are valid", async () => {
    const goToNextStep = vi.fn();
    renderPersonalInfoStep({ goToNextStep });
    await userEvent.type(screen.getByLabelText(/firstname/i), "Ada");
    await userEvent.type(screen.getByLabelText(/lastname/i), "Lovelace");
    await userEvent.click(
      screen.getByRole("button", { name: /continue signup/i }),
    );
    await waitFor(() => {
      expect(goToNextStep).toHaveBeenCalled();
    });
  });

  it("shows error when first name exceeds 50 characters", async () => {
    const goToNextStep = vi.fn();
    renderPersonalInfoStep({ goToNextStep });
    await userEvent.type(
      screen.getByLabelText(/firstname/i),
      "a".repeat(51),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /continue signup/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText("First name cannot exceed 50 characters"),
      ).toBeInTheDocument();
    });
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it("shows error when last name exceeds 50 characters", async () => {
    const goToNextStep = vi.fn();
    renderPersonalInfoStep({ goToNextStep });
    await userEvent.type(screen.getByLabelText(/firstname/i), "Ada");
    await userEvent.type(
      screen.getByLabelText(/lastname/i),
      "a".repeat(51),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /continue signup/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText("Last name cannot exceed 50 characters"),
      ).toBeInTheDocument();
    });
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it("re-validates first name on change after first submit attempt", async () => {
    renderPersonalInfoStep();
    await userEvent.click(
      screen.getByRole("button", { name: /continue signup/i }),
    );
    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(/firstname/i), "Ada");
    await waitFor(() => {
      expect(
        screen.queryByText("First name is required"),
      ).not.toBeInTheDocument();
    });
  });

  it("re-validates last name on change after first submit attempt", async () => {
    renderPersonalInfoStep();
    await userEvent.type(screen.getByLabelText(/firstname/i), "Ada");
    await userEvent.type(
      screen.getByLabelText(/lastname/i),
      "a".repeat(51),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /continue signup/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText("Last name cannot exceed 50 characters"),
      ).toBeInTheDocument();
    });
    await userEvent.clear(screen.getByLabelText(/lastname/i));
    await userEvent.type(screen.getByLabelText(/lastname/i), "Lovelace");
    await waitFor(() => {
      expect(
        screen.queryByText("Last name cannot exceed 50 characters"),
      ).not.toBeInTheDocument();
    });
  });

  it("does not show errors before first submit", async () => {
    renderPersonalInfoStep();
    await userEvent.type(screen.getByLabelText(/firstname/i), "A");
    await userEvent.clear(screen.getByLabelText(/firstname/i));
    expect(
      screen.queryByText("First name is required"),
    ).not.toBeInTheDocument();
  });
});
