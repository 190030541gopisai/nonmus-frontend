import { createBrowserRouter } from "react-router-dom";
import SignUpPage from "../features/auth/pages/SignUpPage";
import LoginPage from "../features/auth/pages/LoginPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import HomePage from "../features/home/pages/HomePage";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
]);