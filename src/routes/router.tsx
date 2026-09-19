import { createBrowserRouter } from "react-router-dom";
import SignUpPage from "../features/auth/pages/SignUpPage";

export const router = createBrowserRouter([
  {
    path: "/signup",
    element: <SignUpPage />,
  },
]);
