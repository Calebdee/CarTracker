import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");

  // Still no token → back to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
