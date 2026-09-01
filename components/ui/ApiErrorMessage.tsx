'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, ShieldAlert, WifiOff, XCircle } from 'lucide-react';

interface ApiErrorMessageProps {
  error?: string | null;
  statusCode?: number;
  onRetry?: () => void;
}

export const ApiErrorMessage: React.FC<ApiErrorMessageProps> = ({ error, statusCode, onRetry }) => {
  if (!error) return null;

  let title = 'API REQUEST ERROR';
  let icon = <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />;
  let colorStyle = 'bg-red-950/50 border-red-800/80 text-red-200';

  if (statusCode === 401) {
    title = 'AUTHENTICATION EXPIRED (401)';
    icon = <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
    colorStyle = 'bg-amber-950/50 border-amber-800/80 text-amber-200';
  } else if (statusCode === 403) {
    title = 'ACCESS FORBIDDEN (403)';
    icon = <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />;
    colorStyle = 'bg-purple-950/50 border-purple-800/80 text-purple-200';
  } else if (statusCode === 404) {
    title = 'RESOURCE NOT FOUND (404)';
    icon = <XCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />;
    colorStyle = 'bg-slate-900 border-cyan-800 text-cyan-200';
  } else if (statusCode === 409) {
    title = 'RESOURCE CONFLICT (409)';
    icon = <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />;
    colorStyle = 'bg-yellow-950/50 border-yellow-800/80 text-yellow-200';
  } else if (statusCode === 429) {
    title = 'RATE LIMIT EXCEEDED (429)';
    icon = <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />;
    colorStyle = 'bg-orange-950/50 border-orange-800/80 text-orange-200';
  } else if (statusCode === 0 || error.includes('Network Error')) {
    title = 'BACKEND CONNECTION ERROR';
    icon = <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
    colorStyle = 'bg-amber-950/60 border-amber-700 text-amber-200';
  }

  return (
    <div className={`p-4 rounded-lg border text-xs font-mono flex items-start gap-3 my-3 ${colorStyle}`}>
      {icon}
      <div className="flex-1">
        <div className="font-bold flex items-center justify-between">
          <span>{title}</span>
          {statusCode && <span className="px-1.5 py-0.5 bg-black/40 rounded text-[10px]">HTTP {statusCode}</span>}
        </div>
        <p className="mt-1 leading-relaxed opacity-90">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition text-[11px]"
          >
            RETRY REQUEST
          </button>
        )}
      </div>
    </div>
  );
};
