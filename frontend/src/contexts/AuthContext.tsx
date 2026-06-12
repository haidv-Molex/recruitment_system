import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi, changePasswordApi, updateProfileApi } from '../services/authApi';

export interface AuthUser {
  user_id: number;
  user_name: string;
  user_role: string;
  user_description?: string;
  department_id?: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (account: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (username: string, description: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const USER_KEY = 'recruitment_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem(USER_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (account: string, password: string) => {
    try {
      const userObj = await loginApi(account, password);
      setUser(userObj as any);
      localStorage.setItem(USER_KEY, JSON.stringify(userObj));
      return { success: true };
    } catch (err: any) {
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

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await changePasswordApi(oldPassword, newPassword);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Change password failed.',
      };
    }
  };

  const updateProfile = async (username: string, description: string) => {
    try {
      const updatedUser = await updateProfileApi(username, description);
      const newUserData = {
        ...user,
        user_name: updatedUser.user_name,
        user_description: updatedUser.user_description,
        department_id: updatedUser.department_id,
      } as AuthUser;
      setUser(newUserData);
      localStorage.setItem(USER_KEY, JSON.stringify(newUserData));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Update profile failed.',
      };
    }
  };

  const value: AuthContextType = {
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
