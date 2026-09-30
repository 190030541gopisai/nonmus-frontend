import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./routes/router", () => ({
  router: { id: "test-router" },
}));

vi.mock("react-router-dom", () => ({
  RouterProvider: ({ router }: { router: { id: string } }) => (
    <div data-testid="router-provider">{router.id}</div>
  ),
}));

describe("App", () => {
  it("renders the router inside the query client provider", () => {
    render(<App />);

    expect(screen.getByTestId("router-provider")).toHaveTextContent(
      "test-router",
    );
  });
});
