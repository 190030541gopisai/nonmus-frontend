import { Navigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import apiClient from "../../../api/apiClient";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<boolean | null>(null);

  // Verify session on mount to decide whether to render children or redirect to login
  useEffect(() => {
    apiClient.get("/v1/auth/me").then(() => setAuth(true)).catch(() => setAuth(false));
  }, []);

  if (auth === null) return <div>Loading…</div>;
  if (auth === false) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
