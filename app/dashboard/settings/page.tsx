'use client';

import React from 'react';
import { Settings, Server, ShieldCheck, User, CheckCircle2, RefreshCw, ChevronDown } from 'lucide-react';
import { BACKEND_ENDPOINT_COVERAGE } from '@/lib/mock/mockData';
import { useAuth } from '@/lib/auth/AuthContext';
import { isMockMode, getApiBaseUrl } from '@/lib/api/client';

export default function SettingsPage() {
  const { user, refreshUser, isMockAuth } = useAuth();
  const coverage = BACKEND_ENDPOINT_COVERAGE;
  const mock = isMockMode() || isMockAuth;
  const baseUrl = getApiBaseUrl();

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            System Settings & API Diagnostic Panel
          </h1>
          <p className="text-gray-400 mt-1">
            Environment configuration, active administrator session profile, and backend API diagnostic matrix.
          </p>
        </div>

        <button
          onClick={() => refreshUser()}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>RE-VERIFY GET /admin/auth/me</span>
        </button>
      </div>

      {/* Admin Profile Card */}
      <div className="math-card p-6 space-y-4">
        <h3 className="font-bold text-gray-300 uppercase tracking-wider border-b border-cyber-border pb-2 flex items-center gap-2 font-mono">
          <User className="w-4 h-4 text-blue-400" />
          VERIFIED ADMIN SESSION PROFILE (GET /admin/auth/me)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-gray-400 block mb-1 font-mono text-[10px]">ADMIN USER ID</span>
            <span className="font-bold text-gray-200 font-mono text-[11px] truncate block">{user?.id || 'N/A'}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-gray-400 block mb-1 font-mono text-[10px]">ADMINISTRATOR HANDLE</span>
            <span className="font-bold text-gray-200 font-mono">{user?.username || 'admin_username'}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-gray-400 block mb-1 font-mono text-[10px]">AUTHORIZATION ROLE</span>
            <span className="font-bold text-cyan-400 font-mono">{user?.role || 'ADMIN'}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-gray-400 block mb-1 font-mono text-[10px]">ACCOUNT STATUS</span>
            <span className="font-bold text-emerald-400 font-mono">ACTIVE SESSION</span>
          </div>
        </div>
      </div>

      {/* Environment Config */}
      <div className="math-card p-6 space-y-4">
        <h3 className="font-bold text-gray-300 uppercase tracking-wider border-b border-cyber-border pb-2 flex items-center gap-2 font-mono">
          <Server className="w-4 h-4 text-emerald-400" />
          ENVIRONMENT CONFIGURATION (.env.local)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-gray-400 block mb-1 font-mono text-[10px]">NEXT_PUBLIC_API_BASE_URL</span>
            <span className="font-bold text-emerald-400 font-mono">{baseUrl}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-gray-400 block mb-1 font-mono text-[10px]">NEXT_PUBLIC_USE_MOCK_DATA</span>
            <span className={`font-bold font-mono ${mock ? 'text-amber-400' : 'text-emerald-400'}`}>
              {mock ? 'true (Demo Mode)' : 'false (Real Backend)'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-gray-400 block mb-1 font-mono text-[10px]">CORS STATUS</span>
            <span className="font-bold text-amber-400 font-mono">REQUIRES BACKEND CORS ORIGIN</span>
          </div>
        </div>
      </div>

      {/* P3: Expandable API Endpoint Coverage Matrix */}
      <details className="math-card p-6 space-y-4 group cursor-pointer">
        <summary className="font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between font-mono list-none select-none">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            AUTHORITATIVE BACKEND ENDPOINT COVERAGE MATRIX ({coverage.length} CONTRACTS)
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
        </summary>

        <div className="overflow-x-auto pt-4 border-t border-cyber-border mt-4">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] border-b border-cyber-border font-mono">
              <tr>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Endpoint</th>
                <th className="py-2.5 px-4">Scope</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Integration Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {coverage.map((ep) => (
                <tr key={ep.endpoint} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] border
                      ${ep.method === 'GET' ? 'text-emerald-300 bg-emerald-950 border-emerald-800' : 
                        ep.method === 'POST' ? 'text-blue-300 bg-blue-950 border-blue-800' :
                        'text-amber-300 bg-amber-950 border-amber-800'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-cyan-300">{ep.endpoint}</td>
                  <td className="py-3 px-4 text-gray-400 font-sans">{ep.requiredScope}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CONTRACT READY
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-[11px] font-sans max-w-xs">{ep.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
