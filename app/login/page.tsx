'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Shield, Lock, User, ArrowRight, Loader2, Server } from 'lucide-react';
import { BackendBanner } from '@/components/ui/BackendBanner';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { MOCK_ORGANIZATION } from '@/lib/mock/mockData';
import { useAuth } from '@/lib/auth/AuthContext';
import { isMockMode, getApiBaseUrl } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('admin_username');
  const [password, setPassword] = useState('admin_password');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const mock = isMockMode();
  const baseUrl = getApiBaseUrl();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusCode(undefined);
    setNotice(null);
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      setNotice(result.message || 'Login successful. Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } else {
      setErrorMessage(result.message || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-gray-100 flex flex-col justify-center items-center p-6 bg-math-grid relative font-mono">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 mb-1">
            <Calculator className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            MATHHUNT
          </h1>
          <div className="text-xs text-cyan-400 font-bold bg-cyan-950/60 py-1 px-3 rounded-full border border-cyan-800/60 inline-block">
            ADMIN CONTROL CENTER
          </div>

          <div className="text-xs text-gray-400 pt-2 space-y-0.5">
            <div className="font-semibold text-gray-300">{MOCK_ORGANIZATION.club}</div>
            <div>{MOCK_ORGANIZATION.department}</div>
            <div className="text-gray-500 text-[11px]">{MOCK_ORGANIZATION.college}</div>
          </div>
        </div>

        <BackendBanner
          endpoint="/admin/auth/login"
          method="POST"
          description={
            mock
              ? 'Demo mode active. Any input will log in under Development Mock Session.'
              : `Communicating with NestJS auth server at ${baseUrl}. Credentials are verified against NestJS PostgreSQL.`
          }
        />

        {notice && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-lg text-emerald-300 text-xs text-center animate-pulse mb-4">
            {notice}
          </div>
        )}

        <ApiErrorMessage error={errorMessage} statusCode={statusCode} />

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">ADMINISTRATOR HANDLE</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-gray-200 focus:outline-none focus:border-blue-500"
                placeholder="admin_username"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">SECURITY PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-gray-200 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AUTHENTICATING WITH NESTJS...</span>
              </>
            ) : (
              <>
                <span>ENTER CONTROL CENTER</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-center text-gray-500 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-gray-400">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target: {baseUrl}</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-gray-500">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>Authoritative backend: NestJS 11 + Prisma + PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
