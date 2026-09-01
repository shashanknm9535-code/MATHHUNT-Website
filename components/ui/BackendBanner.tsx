import React from 'react';
import { AlertTriangle, Server, ShieldAlert } from 'lucide-react';
import { isMockMode, getApiBaseUrl } from '@/lib/api/client';

interface BackendBannerProps {
  endpoint: string;
  method?: string;
  description?: string;
  compact?: boolean;
}

export const BackendBanner: React.FC<BackendBannerProps> = ({
  endpoint,
  method = 'POST',
  description,
  compact = false,
}) => {
  const mock = isMockMode();
  const baseUrl = getApiBaseUrl();

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono rounded border bg-slate-800 border-slate-700 text-gray-300">
        <Server className="w-3 h-3 text-cyan-400" />
        <span>API: {method} {endpoint}</span>
        {mock ? (
          <span className="text-[9px] bg-amber-950 text-amber-300 px-1 rounded">DEMO MODE</span>
        ) : (
          <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 rounded">REAL BACKEND</span>
        )}
      </span>
    );
  }

  return (
    <div
      className={`border rounded-lg p-3 text-xs font-mono flex items-start gap-3 my-2 ${
        mock
          ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
          : 'bg-slate-900/80 border-slate-700/80 text-gray-200'
      }`}
    >
      {mock ? (
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      ) : (
        <Server className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 font-bold">
          <span>{mock ? 'DEMO / MOCK MODE ACTIVE' : 'LIVE NESTJS BACKEND INTEGRATION'}</span>
          <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 text-[10px]">
            {method} {endpoint}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] ${
              mock ? 'bg-amber-900 text-amber-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {mock ? 'MOCK DATA' : `CONNECTED: ${baseUrl}`}
          </span>
        </div>
        <p className="mt-1 opacity-80">
          {description ||
            (mock
              ? 'Application is currently running in offline visual demo mode.'
              : `Communicating directly with NestJS backend at ${baseUrl}.`)}
        </p>
      </div>
    </div>
  );
};

export const AdminSecretNotice: React.FC = () => {
  return (
    <div className="bg-purple-950/40 border border-purple-800/60 rounded-lg p-3 text-purple-200 text-xs font-mono flex items-start gap-2.5 my-2">
      <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
      <div>
        <span className="font-bold text-purple-300">AUTHORITATIVE BACKEND DATA NOTICE:</span>
        <p className="mt-0.5 text-purple-200/80">
          Challenge and Riddle answer keys are admin-only secret data stored securely on PostgreSQL via NestJS. They are strictly filtered and NEVER sent to non-admin Android clients.
        </p>
      </div>
    </div>
  );
};
