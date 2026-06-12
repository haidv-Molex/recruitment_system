import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi, changePasswordApi, updateProfileApi, refreshTokenApi } from '../services/authApi';

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

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await refreshTokenApi();
        if (token) {
          const saved = localStorage.getItem(USER_KEY);
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            const decoded = decodeJwt(token);
            if (decoded && decoded.user_id) {
              const basicUser: AuthUser = {
                user_id: decoded.user_id,
                user_name: decoded.name || 'User',
                user_role: 'user',
              };
              setUser(basicUser);
              localStorage.setItem(USER_KEY, JSON.stringify(basicUser));
            }
          }
        }
      } catch (err) {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
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
