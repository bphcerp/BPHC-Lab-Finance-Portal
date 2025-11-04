import React from "react";
import { Navigate, useSearchParams } from "react-router";
import { useUser } from "../context/UserContext";

interface ProtectedRouteProps {
  homePage?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  homePage,
  children,
}) => {
  const { isAuthenticated, loading } = useUser();
  const [searchParams] = useSearchParams();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (homePage && isAuthenticated) {
    return <Navigate to={searchParams.get("next") ?? "/dashboard"} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
