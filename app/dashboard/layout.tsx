'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { useAuth } from '@/lib/auth/AuthContext';
import { isMockMode } from '@/lib/api/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const mock = isMockMode();

  useEffect(() => {
    // Once the auth check is complete, redirect unauthenticated users to /login.
    // In mock/demo mode we skip this check entirely — demo mode is always "authenticated".
    if (!isLoading && !isAuthenticated && !mock) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, mock, router]);

  // While auth is resolving, show a full-screen loading state rather than
  // briefly flashing the dashboard shell with stale or empty data.
  if (isLoading && !mock) {
    return (
      <div className="min-h-screen bg-cyber-dark text-gray-100 bg-math-grid flex flex-col items-center justify-center gap-4 font-mono">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <div className="text-cyan-400 font-bold tracking-widest text-sm">VERIFYING ADMIN SESSION...</div>
        <div className="text-gray-500 text-xs">GET /admin/auth/me</div>
      </div>
    );
  }

  // If not loading and not authenticated (and not mock), render nothing while
  // the useEffect redirect fires — prevents any dashboard flash.
  if (!isAuthenticated && !mock) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-cyber-dark text-gray-100 bg-math-grid">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
