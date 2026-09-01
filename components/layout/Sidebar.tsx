'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlaySquare,
  Users,
  Route,
  MapPin,
  HelpCircle,
  Puzzle,
  Radio,
  ShieldAlert,
  Trophy,
  BarChart3,
  Settings,
  Calculator,
  Building2,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_ORGANIZATION } from '@/lib/mock/mockData';
import { useAuth } from '@/lib/auth/AuthContext';
import { isMockMode, getApiBaseUrl } from '@/lib/api/client';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/event', label: 'Event Control', icon: PlaySquare },
  { href: '/dashboard/teams', label: 'Teams Roster', icon: Users },
  { href: '/dashboard/routes', label: 'Routes & Steps', icon: Route },
  { href: '/dashboard/locations', label: 'Locations & QR', icon: MapPin },
  { href: '/dashboard/challenges', label: 'Math Challenges', icon: HelpCircle },
  { href: '/dashboard/riddles', label: 'Riddles & Maps', icon: Puzzle },
  { href: '/dashboard/live', label: 'Live Monitor', icon: Radio, badge: 'LIVE' },
  { href: '/dashboard/violations', label: 'Violations Log', icon: ShieldAlert },
  { href: '/dashboard/audit', label: 'Audit Trail', icon: ShieldCheck },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'System Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, isMockAuth } = useAuth();
  const mock = isMockMode() || isMockAuth;
  const baseUrl = getApiBaseUrl();

  return (
    <aside className="w-72 bg-cyber-card border-r border-cyber-border flex flex-col h-screen sticky top-0 shrink-0 select-none font-mono">
      {/* Brand Header */}
      <div className="p-4 border-b border-cyber-border bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5">
              MATHHUNT
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                ADMIN CONTROL
              </span>
              {user?.role === 'SUPER_ADMIN' && (
                <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> SUPER
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] space-y-1 text-gray-400">
          <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{MOCK_ORGANIZATION.club}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{MOCK_ORGANIZATION.department}</span>
          </div>
          <div className="text-[10px] text-gray-500 pl-5">
            {MOCK_ORGANIZATION.college}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Dev Note */}
      <div className="p-3 border-t border-cyber-border bg-slate-950/80 text-[10px] text-gray-500 space-y-1">
        <div className="flex items-center justify-between text-gray-400">
          <span>NestJS API:</span>
          {mock ? (
            <span className="text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800 font-bold">
              DEMO MODE
            </span>
          ) : (
            <span className="text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 font-bold">
              CONNECTED
            </span>
          )}
        </div>
        <p className="text-gray-600 text-[9px] leading-relaxed truncate">
          Target: {baseUrl}
        </p>
      </div>
    </aside>
  );
};
