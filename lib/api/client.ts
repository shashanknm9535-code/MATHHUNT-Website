/**
 * ============================================================================
 * MATHHUNT CENTRALIZED HTTP API CLIENT
 * ============================================================================
 * Handles all network requests to the NestJS authoritative backend.
 * Features:
 * - JWT Authorization header injection
 * - NestJS error parsing (400, 401, 403, 404, 409, 429, 500)
 * - Automatic 401 Unauthorized handling
 * - Mode detection (REAL BACKEND vs DEMO MOCK MODE)
 * ============================================================================
 */

import { NestApiError } from '@/types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  isMockData: boolean;
  endpointRequired?: string;
  message?: string;
}

const STORAGE_KEY = 'mathhunt_admin_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, token);
  }
}

export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (isMockMode()) {
    return {
      success: false,
      isMockData: true,
      error: 'DEMO_MOCK_MODE_ACTIVE',
      message: 'Application is configured in Demo / Mock Mode.',
    };
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const statusCode = response.status;

    if (statusCode === 401) {
      removeStoredToken();
      if (typeof window !== 'undefined' && token) {
        window.dispatchEvent(new Event('mathhunt_unauthorized'));
      }
      return {
        success: false,
        statusCode: 401,
        error: 'Unauthorized: Session expired or invalid token. Please log in again.',
        isMockData: false,
      };
    }

    if (statusCode === 403) {
      return {
        success: false,
        statusCode: 403,
        error: 'Forbidden: You do not have sufficient admin permissions for this operation.',
        isMockData: false,
      };
    }

    let payload: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${statusCode}`;
      if (payload && typeof payload === 'object') {
        const nestErr = payload as NestApiError;
        if (Array.isArray(nestErr.message)) {
          errorMessage = nestErr.message.join(', ');
        } else if (nestErr.message) {
          errorMessage = nestErr.message;
        } else if (nestErr.error) {
          errorMessage = nestErr.error;
        }
      } else if (typeof payload === 'string' && payload) {
        errorMessage = payload;
      }

      return {
        success: false,
        statusCode,
        error: errorMessage,
        isMockData: false,
      };
    }

    return {
      success: true,
      statusCode,
      data: payload as T,
      isMockData: false,
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 0,
      error: `Network Error: Could not connect to NestJS backend at ${baseUrl}. Ensure backend server is running and CORS is configured. (${err.message || 'Connection refused'})`,
      isMockData: false,
    };
  }
}
