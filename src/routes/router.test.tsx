import { describe, expect, it } from "vitest";
import { router } from "./router";
import LoginPage from "../features/auth/pages/LoginPage";
import SignUpPage from "../features/auth/pages/SignUpPage";
import HomePage from "../features/home/pages/HomePage";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";

describe("router", () => {
  it("defines login, home, and signup routes", () => {
    expect(router.routes.map((route) => route.path)).toEqual([
      "/login",
      "/",
      "/signup",
    ]);
  });

  it("uses expected page elements for public routes", () => {
    const loginRoute = router.routes.find((route) => route.path === "/login");
    const signupRoute = router.routes.find((route) => route.path === "/signup");

    expect(loginRoute?.element).toEqual(<LoginPage />);
    expect(signupRoute?.element).toEqual(<SignUpPage />);
  });

  it("wraps home page in ProtectedRoute", () => {
    const homeRoute = router.routes.find((route) => route.path === "/");

    expect(homeRoute?.element).toEqual(
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>,
    );
  });
});
