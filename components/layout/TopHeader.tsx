'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Server, User, LogOut, ShieldCheck, AlertTriangle, Menu } from 'lucide-react';
import { EventStatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useEvent } from '@/lib/auth/EventContext';
import { useSidebar } from '@/components/layout/SidebarContext';
import { isMockMode, getApiBaseUrl } from '@/lib/api/client';
import Link from 'next/link';

export const TopHeader: React.FC = () => {
  const [time, setTime] = useState<string>('');
  const { user, logout, isMockAuth } = useAuth();
  const { selectedEvent } = useEvent();
  const { toggleMobileMenu } = useSidebar();
  const mock = isMockMode() || isMockAuth;
  const baseUrl = getApiBaseUrl();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-cyber-card border-b border-cyber-border px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-slate-900/90 font-sans">
      {/* Event & System Status + Mobile Menu Trigger */}
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-cyan-400 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-gray-400 font-semibold hidden xs:inline">EVENT:</span>
          {selectedEvent ? (
            <>
              <EventStatusBadge status={selectedEvent.status} />
              <span className="text-gray-300 font-bold hidden sm:inline max-w-[160px] sm:max-w-[200px] truncate">{selectedEvent.name}</span>
            </>
          ) : (
            <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
              NO ACTIVE EVENT
            </span>
          )}
        </div>

        {/* Compact Connection Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 font-mono">
          {mock ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>DEMO MOCK MODE</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>LIVE • CONNECTED</span>
              <span className="text-[10px] text-gray-500 font-normal truncate max-w-[140px]">({baseUrl})</span>
            </span>
          )}
        </div>
      </div>

      {/* Clock & User Controls */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-gray-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{time || '10:42:00 IST'}</span>
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="flex items-center gap-2 text-gray-200">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold">
              {user?.role === 'SUPER_ADMIN' ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <User className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-bold text-gray-200">{user?.username || 'admin_user'}</div>
              <div className="text-[10px] text-cyan-400 font-bold">
                {user?.role || 'ADMIN'}
              </div>
            </div>
          </div>

          <Link
            href="/login"
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
