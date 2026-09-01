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

// Default context: isAuthenticated=false, isLoading=true.
// This prevents the login page from reading a "true" default and redirecting
// before the AuthProvider has a chance to validate the stored token.
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
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

  /**
   * Clears the session atomically and performs a hard navigation to /login.
   * Uses window.location.replace so the browser history does not contain the
   * expired dashboard URL — pressing Back will not re-trigger a 401 loop.
   * Safe to call multiple times: the pathname guard prevents duplicate redirects.
   */
  const redirectToLogin = () => {
    removeStoredToken();
    setUser(null);
    setIsAuthenticated(false);
    setIsMockAuth(false);
    setIsLoading(false);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.replace('/login');
    }
  };

  const refreshUser = async () => {
    // Mock / demo mode — bypass real token validation entirely
    if (isMockMode()) {
      setUser(MOCK_ADMIN_USER);
      setIsAuthenticated(true);
      setIsMockAuth(true);
      setIsLoading(false);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      // No token stored — show login, do not redirect (may already be on /login)
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
      setIsLoading(false);
    } else {
      // Token is expired or invalid — clear and redirect
      redirectToLogin();
    }
  };

  useEffect(() => {
    // Validate stored token on mount
    refreshUser();

    // Listen for centralized 401 events dispatched by fetchApi in client.ts.
    // Any authenticated API call that receives HTTP 401 fires this event,
    // ensuring the session is cleared even if the user never calls refreshUser.
    const handleUnauthorized = () => {
      redirectToLogin();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mathhunt_unauthorized', handleUnauthorized);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mathhunt_unauthorized', handleUnauthorized);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Fallback: construct minimal user from login response if /me is slow/unavailable
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
    // Clears token, resets state, redirects to /login
    redirectToLogin();
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
