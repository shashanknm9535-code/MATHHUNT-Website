import React from 'react';
import { EventStatus, TeamStatus, ViolationSeverity, ViolationType } from '@/types';
import { cn } from '@/lib/utils';

export const EventStatusBadge: React.FC<{ status: EventStatus }> = ({ status }) => {
  const styles: Record<EventStatus, string> = {
    DRAFT: 'bg-gray-800 text-gray-300 border-gray-700',
    READY: 'bg-blue-950 text-blue-400 border-blue-800',
    LIVE: 'bg-emerald-950 text-emerald-400 border-emerald-700 animate-pulse',
    PAUSED: 'bg-amber-950 text-amber-400 border-amber-800',
    COMPLETED: 'bg-indigo-950 text-indigo-300 border-indigo-700',
    CANCELLED: 'bg-red-950 text-red-400 border-red-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border',
        styles[status] || 'bg-gray-800 text-gray-300'
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

export const TeamStatusBadge: React.FC<{ status: TeamStatus }> = ({ status }) => {
  const styles: Record<TeamStatus, string> = {
    ACTIVE: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
    PAUSED: 'bg-amber-950/80 text-amber-400 border-amber-800',
    COMPLETED: 'bg-blue-950/80 text-blue-400 border-blue-800',
    DISQUALIFIED: 'bg-red-950/80 text-red-400 border-red-800',
    PENDING: 'bg-gray-800 text-gray-300 border-gray-700',
    SOLVING_MATH: 'bg-emerald-950/80 text-emerald-300 border-emerald-700',
    SOLVING_RIDDLE: 'bg-purple-950/80 text-purple-300 border-purple-700',
    SCANNING_QR: 'bg-cyan-950/80 text-cyan-300 border-cyan-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border',
        styles[status] || 'bg-gray-800 text-gray-300'
      )}
    >
      {status}
    </span>
  );
};

export const ViolationSeverityBadge: React.FC<{ severity: ViolationSeverity }> = ({ severity }) => {
  const styles: Record<ViolationSeverity, string> = {
    LOW: 'bg-slate-800 text-slate-300 border-slate-700',
    MEDIUM: 'bg-yellow-950 text-yellow-400 border-yellow-800',
    HIGH: 'bg-orange-950 text-orange-400 border-orange-800',
    CRITICAL: 'bg-red-950 text-red-400 border-red-800 font-bold',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-mono border', styles[severity])}>
      {severity}
    </span>
  );
};

export const ViolationTypeBadge: React.FC<{ type: ViolationType }> = ({ type }) => {
  return (
    <span className="px-2 py-0.5 rounded text-xs font-mono bg-red-950/50 text-red-300 border border-red-900/60">
      {type}
    </span>
  );
};
