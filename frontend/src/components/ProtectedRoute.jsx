import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, roles, allowUnonboarded = false }) => {
  const { user, token } = useAuth();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  const needsOnboarding = !user.organization_id || (user.role !== 'admin' && !user.department_id);
  if (!allowUnonboarded && needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
