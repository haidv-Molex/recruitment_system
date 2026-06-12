import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi, changePasswordApi, updateProfileApi } from '../services/authApi';

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
    try {
      const userObj = await loginApi(account, password);
      setUser(userObj);
      localStorage.setItem(USER_KEY, JSON.stringify(userObj));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Login failed.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    logoutApi();
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await changePasswordApi(oldPassword, newPassword);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Change password failed.',
      };
    }
  };

  const updateProfile = async (username, description) => {
    try {
      const updatedUser = await updateProfileApi(username, description);
      const newUserData = {
        ...user,
        user_name: updatedUser.user_name,
        user_description: updatedUser.user_description,
        department_id: updatedUser.department_id,
      };
      setUser(newUserData);
      localStorage.setItem(USER_KEY, JSON.stringify(newUserData));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Update profile failed.',
      };
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.user_role === 'admin',
    isLoading,
    login,
    logout,
    changePassword,
    updateProfile,
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