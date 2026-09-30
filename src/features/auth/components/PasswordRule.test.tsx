import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PasswordRule from "./PasswordRule";

describe("PasswordRule", () => {
  it("renders rule text", () => {
    render(<PasswordRule valid={false} text="Password must contain a number" />);

    expect(
      screen.getByText("Password must contain a number"),
    ).toBeInTheDocument();
  });

  it("renders invalid state without checkmark", () => {
    const { container } = render(
      <PasswordRule valid={false} text="Password must contain a number" />,
    );
    const indicator = container.querySelector("div > span");

    expect(indicator).toHaveClass("border-gray-300", "bg-gray-50");
    expect(indicator).not.toHaveClass("border-green-500", "bg-green-500");
    expect(indicator?.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders valid state with checkmark", () => {
    const { container } = render(
      <PasswordRule valid text="Password must contain a number" />,
    );
    const indicator = container.querySelector("div > span");

    expect(indicator).toHaveClass("border-green-500", "bg-green-500", "text-white");
    expect(indicator).not.toHaveClass("border-gray-300", "bg-gray-50");
    expect(indicator?.querySelector("svg")).toBeInTheDocument();
    expect(indicator?.querySelector("path")).toBeInTheDocument();
  });

  it("renders empty rule text", () => {
    const { container } = render(<PasswordRule valid text="" />);

    expect(container.querySelectorAll("div > span")).toHaveLength(2);
  });
});
