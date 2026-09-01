'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AdminRole } from '@/types';
import { authApi } from '@/lib/api';
import { getStoredToken, setStoredToken, removeStoredToken, isMockMode } from '@/lib/api/client';
import { MOCK_ADMIN_USER } from '@/lib/mock/mockData';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMockAuth: boolean;
  loginRequiredEndpoint: string;
  login: (username: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: MOCK_ADMIN_USER,
  isAuthenticated: true,
  isLoading: false,
  isMockAuth: false,
  loginRequiredEndpoint: 'POST /admin/auth/login',
  login: async () => ({ success: false, message: 'Auth not initialized' }),
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMockAuth, setIsMockAuth] = useState<boolean>(false);

  const loginRequiredEndpoint = 'POST /admin/auth/login';

  const refreshUser = async () => {
    if (isMockMode()) {
      setUser(MOCK_ADMIN_USER);
      setIsAuthenticated(true);
      setIsMockAuth(true);
      setIsLoading(false);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsMockAuth(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const res = await authApi.getMe();
    if (res.success && res.data) {
      setUser(res.data);
      setIsAuthenticated(true);
      setIsMockAuth(res.isMockData);
    } else {
      removeStoredToken();
      setUser(null);
      setIsAuthenticated(false);
      setIsMockAuth(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      removeStoredToken();
      setUser(null);
      setIsAuthenticated(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mathhunt_unauthorized', handleUnauthorized);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mathhunt_unauthorized', handleUnauthorized);
      }
    };
  }, []);

  const login = async (
    username: string,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!username.trim() || !pass.trim()) {
      return { success: false, message: 'Please enter both username and password.' };
    }

    setIsLoading(true);
    const res = await authApi.login(username, pass);

    if (res.success && res.data?.access_token) {
      setStoredToken(res.data.access_token);
      setIsMockAuth(res.isMockData);

      // Verify user profile via GET /admin/auth/me
      const meRes = await authApi.getMe();
      if (meRes.success && meRes.data) {
        setUser(meRes.data);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true, message: 'Admin session authenticated successfully.' };
      } else {
        // Fallback user if getMe is pending
        const role: AdminRole = res.data.user?.role || 'ADMIN';
        const fallbackUser: AdminUser = {
          id: res.data.user?.id || 'admin-01',
          username: res.data.user?.username || username,
          role,
        };
        setUser(fallbackUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true, message: 'Authenticated successfully.' };
      }
    } else {
      setIsLoading(false);
      return {
        success: false,
        message: res.error || 'Authentication failed. Invalid admin credentials or server unreachable.',
      };
    }
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setIsAuthenticated(false);
    setIsMockAuth(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isMockAuth,
        loginRequiredEndpoint,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
