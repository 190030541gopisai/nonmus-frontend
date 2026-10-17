import { describe, expect, it } from "vitest";
import { router } from "./router";
import LoginPage from "../features/auth/pages/LoginPage";
import SignUpPage from "../features/auth/pages/SignUpPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import HomePage from "../features/home/pages/HomePage";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";

describe("router", () => {
  it("defines login, home, signup, and forgot-password routes", () => {
    expect(router.routes.map((route) => route.path)).toEqual([
      "/login",
      "/",
      "/signup",
      "/forgot-password",
    ]);
  });

  it("uses expected page elements for public routes", () => {
    const loginRoute = router.routes.find((route) => route.path === "/login");
    const signupRoute = router.routes.find((route) => route.path === "/signup");
    const forgotPasswordRoute = router.routes.find(
      (route) => route.path === "/forgot-password",
    );

    expect(loginRoute?.element).toEqual(<LoginPage />);
    expect(signupRoute?.element).toEqual(<SignUpPage />);
    expect(forgotPasswordRoute?.element).toEqual(<ForgotPasswordPage />);
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
