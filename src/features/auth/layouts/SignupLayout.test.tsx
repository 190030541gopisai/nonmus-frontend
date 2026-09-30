import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SignupLayout from "./SignupLayout";

function renderSignupLayout(
  props: Partial<React.ComponentProps<typeof SignupLayout>> = {},
) {
  return render(
    <MemoryRouter>
      <SignupLayout
        isFirstStep={true}
        goToPreviousStep={vi.fn()}
        {...props}
      >
        <div>Step content</div>
      </SignupLayout>
    </MemoryRouter>,
  );
}

describe("SignupLayout", () => {
  it("renders children and login link", () => {
    renderSignupLayout();

    expect(screen.getByText("Step content")).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("does not render back button on first step", () => {
    const { container } = renderSignupLayout({ isFirstStep: true });

    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders back button and calls handler when clicked after first step", async () => {
    const user = userEvent.setup();
    const goToPreviousStep = vi.fn();
    const { container } = renderSignupLayout({
      isFirstStep: false,
      goToPreviousStep,
    });
    const backButton = container.querySelector("svg");

    expect(backButton).toBeInTheDocument();
    await user.click(backButton!);

    expect(goToPreviousStep).toHaveBeenCalledTimes(1);
  });
});
