import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import apiClient from "../../../api/apiClient";

vi.mock("../../../api/apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockGet = vi.mocked(apiClient.get);

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <h1>Protected content</h1>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<h1>Login page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while authentication is checked", () => {
    mockGet.mockReturnValue(new Promise(() => {}));

    renderProtectedRoute();

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/v1/auth/me");
  });

  it("renders children when authentication succeeds", async () => {
    mockGet.mockResolvedValue({ data: { authenticated: true } });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText("Protected content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("redirects to login when authentication fails", async () => {
    mockGet.mockRejectedValue(new Error("Unauthenticated"));

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText("Login page")).toBeInTheDocument();
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });
});
