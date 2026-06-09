import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateUser } from '../services/authData';

const AuthContext = createContext(null);

// Key lưu trong localStorage (giữ login khi refresh)
const STORAGE_KEY = 'recruitment_auth_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // chờ check localStorage

  // ── Khi app khởi động: kiểm tra đã login trước đó chưa ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  // ── Login ──
  const login = (username, password) => {
    const result = authenticateUser(username, password);
    if (result) {
      setUser(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      return { success: true };
    }
    return { success: false, message: 'Invalid username or password.' };
  };

  // ── Logout ──
  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook để dùng ở bất kỳ component nào
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};