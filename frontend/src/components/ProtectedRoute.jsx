import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // If still checking localStorage for saved session, show loading
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#64748b',
      }}>
        Loading...
      </div>
    );
  }

  // If user is not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If this route requires admin role but user is not admin, show access denied
  if (requireAdmin && !isAdmin) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        gap: '12px',
        color: '#64748b',
      }}>
        <h2 style={{ fontSize: '24px', color: '#dc2626' }}>⛔ Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p style={{ fontSize: '13px' }}>Only administrators can manage user accounts.</p>
      </div>
    );
  }

  return children;
};