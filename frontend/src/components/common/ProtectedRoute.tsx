import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth() as any;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-base text-slate-500 font-medium">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-3 text-slate-500">
        <h2 className="text-2xl font-bold text-red-600">⛔ Access Denied</h2>
        <p className="text-sm">You do not have permission to access this page.</p>
        <p className="text-xs text-slate-400">Only administrators can manage user accounts.</p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.user_role)) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-3 text-slate-500">
        <h2 className="text-2xl font-bold text-red-600">⛔ Access Denied</h2>
        <p className="text-sm">You do not have permission to access this page.</p>
        <p className="text-xs text-slate-400">Only authorized roles can manage user accounts.</p>
      </div>
    );
  }

  return <>{children}</>;
}
export { ProtectedRoute };
