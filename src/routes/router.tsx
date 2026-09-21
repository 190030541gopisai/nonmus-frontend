import { createBrowserRouter } from "react-router-dom";
import SignUpPage from "../features/auth/pages/SignUpPage";
import HomePage from "../features/home/pages/HomePage";

export const router = createBrowserRouter([
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/",
    element: <HomePage />,
  },
]);
