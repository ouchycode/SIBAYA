import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export const RoleBasedRoute = ({ allowedRoles }) => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
