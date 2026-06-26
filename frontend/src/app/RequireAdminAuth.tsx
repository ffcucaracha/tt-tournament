import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth";

export function RequireAdminAuth({ children }: { children: JSX.Element }): JSX.Element {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
