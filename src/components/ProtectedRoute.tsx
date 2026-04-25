import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getTenantPrefix } from '../lib/tenantUtils';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  const tenantPrefix = getTenantPrefix();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to={`${tenantPrefix}/login`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
