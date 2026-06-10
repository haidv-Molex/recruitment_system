import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi } from '../services/authApi';

const AuthContext = createContext(null);
const USER_KEY = 'recruitment_auth_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      // If a saved session exists, restore the user state
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem(USER_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (account, password) => {
    const result = await loginApi(account, password);

    // If login API succeeded, save user to state and localStorage
    if (result.success) {
      setUser(result.user);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      return { success: true };
    }

    return { success: false, message: result.message };
  };

  const logout = () => {
    setUser(null);
    logoutApi();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  // If useAuth is called outside AuthProvider, throw an error
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};