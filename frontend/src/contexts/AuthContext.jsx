import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authenticateUser,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
} from '../services/authData';

const AuthContext = createContext(null);
const STORAGE_KEY = 'recruitment_auth_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // If a saved session exists, restore the user state
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = (username, password) => {
    const result = authenticateUser(username, password);
    // If authentication succeeded, save user to state and localStorage
    if (result) {
      setUser(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      return { success: true };
    }
    return { success: false, message: 'Invalid username or password.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const fetchUsers = useCallback(() => {
    return getAllUsers();
  }, []);

  const createUser = useCallback((userData) => {
    return addUser(userData);
  }, []);

  const editUser = useCallback((id, updates) => {
    return updateUser(id, updates);
  }, []);

  const removeUser = useCallback((id) => {
    // If the user tries to delete their own account, block it
    if (user && user.id === id) {
      return { success: false, message: 'You cannot delete your own account.' };
    }
    return deleteUser(id);
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    logout,
    fetchUsers,
    createUser,
    editUser,
    removeUser,
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