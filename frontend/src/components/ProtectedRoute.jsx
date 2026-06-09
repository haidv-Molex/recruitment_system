import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Đang kiểm tra localStorage → hiện loading
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

  // Chưa login → chuyển đến trang Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Đã login → hiện nội dung
  return children;
};