import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import { login } from "../api/authApi";

vi.mock("../api/authApi", () => ({
  login: vi.fn(),
}));

const mockLogin = vi.mocked(login);

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<h1>Home page</h1>} />
        <Route path="/signup" element={<h1>Signup page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form and signup link", () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email \/ username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign Up" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("shows required validation errors for empty fields", async () => {
    renderLoginPage();

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Email / Username is required"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    renderLoginPage();
    const password = screen.getByLabelText(/^password/i);

    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("submits credentials and navigates home", async () => {
    mockLogin.mockResolvedValue({
      message: "Logged in",
      username: "ada",
      email: "ada@example.com",
      avatar: "",
    });
    renderLoginPage();

    await userEvent.type(
      screen.getByLabelText(/email \/ username/i),
      "ada@example.com",
    );
    await userEvent.type(screen.getByLabelText(/^password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        credential: "ada@example.com",
        password: "secret",
      });
      expect(screen.getByText("Home page")).toBeInTheDocument();
    });
  });

  it("shows API message on login failure", async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: "Invalid credentials" } },
    });
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email \/ username/i), "ada");
    await userEvent.type(screen.getByLabelText(/^password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
  });

  it("shows fallback message on unknown login failure", async () => {
    mockLogin.mockRejectedValue(new Error("Network failure"));
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email \/ username/i), "ada");
    await userEvent.type(screen.getByLabelText(/^password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Login failed. Please try again."),
    ).toBeInTheDocument();
  });

  it("disables submit while login is pending", async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email \/ username/i), "ada");
    await userEvent.type(screen.getByLabelText(/^password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();
    });
  });

  it("shows credential length validation error", async () => {
    renderLoginPage();
    await userEvent.type(
      screen.getByLabelText(/email \/ username/i),
      "a".repeat(256),
    );
    await userEvent.type(screen.getByLabelText(/^password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Email / Username cannot exceed 255 characters"),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
