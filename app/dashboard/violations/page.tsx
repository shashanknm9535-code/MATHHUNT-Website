'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Filter, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { ViolationSeverityBadge, ViolationTypeBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { violationsApi, isMockMode } from '@/lib/api';
import { Violation, ViolationSummary } from '@/types';

export default function ViolationsPage() {
  const mock = isMockMode();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [summary, setSummary] = useState<ViolationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchViolationsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [listRes, summaryRes] = await Promise.all([
      violationsApi.getViolations(page, 20, undefined, undefined, typeFilter),
      violationsApi.getSummary(),
    ]);

    setLoading(false);

    if (listRes.success && listRes.data) {
      setViolations(listRes.data.items || []);
      setTotalPages(listRes.data.totalPages || 1);
      setTotalCount(listRes.data.total || 0);
    } else {
      setError(listRes.error || 'Failed to fetch security violations from NestJS backend.');
      setViolations([]);
    }

    if (summaryRes.success && summaryRes.data) {
      setSummary(summaryRes.data);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchViolationsData();
  }, [fetchViolationsData]);

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Anti-Cheat & Security Violations Audit Log
          </h1>
          <p className="text-gray-400 mt-1">
            Authoritative security events captured by Android listeners & NestJS guards (`GET /admin/violations`).
          </p>
        </div>

        <button
          onClick={fetchViolationsData}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>REFRESH LOG</span>
        </button>
      </div>

      <ApiErrorMessage error={error} onRetry={fetchViolationsData} />

      {/* Aggregate Metric Summary Cards (GET /admin/violations/summary) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono">
        <div className="math-card p-3 border-t-2 border-t-red-500">
          <div className="text-gray-400 text-[10px]">TOTAL VIOLATIONS</div>
          <div className="text-xl font-black text-white mt-1">{summary?.totalViolations ?? totalCount}</div>
        </div>

        <div className="math-card p-3 border-t-2 border-t-red-600 bg-red-950/20">
          <div className="text-red-400 text-[10px] font-bold">CRITICAL SEVERITY</div>
          <div className="text-xl font-black text-red-400 mt-1">{summary?.criticalCount ?? 0}</div>
        </div>

        <div className="math-card p-3 border-t-2 border-t-orange-500">
          <div className="text-gray-400 text-[10px]">HIGH SEVERITY</div>
          <div className="text-xl font-black text-orange-400 mt-1">{summary?.highCount ?? 0}</div>
        </div>

        <div className="math-card p-3 border-t-2 border-t-yellow-500">
          <div className="text-gray-400 text-[10px]">MEDIUM SEVERITY</div>
          <div className="text-xl font-black text-yellow-400 mt-1">{summary?.mediumCount ?? 0}</div>
        </div>

        <div className="math-card p-3 border-t-2 border-t-slate-500">
          <div className="text-gray-400 text-[10px]">LOW SEVERITY</div>
          <div className="text-xl font-black text-slate-300 mt-1">{summary?.lowCount ?? 0}</div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="math-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 font-semibold">Filter by Violation Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-red-500 font-mono font-bold"
          >
            <option value="ALL">All Violation Types</option>
            <option value="APP_BACKGROUND">APP_BACKGROUND</option>
            <option value="SCREENSHOT">SCREENSHOT</option>
            <option value="SCREEN_CAPTURE">SCREEN_CAPTURE</option>
            <option value="MULTI_WINDOW">MULTI_WINDOW</option>
            <option value="INVALID_QR">INVALID_QR</option>
            <option value="WRONG_LOCATION">WRONG_LOCATION</option>
            <option value="SESSION_CONFLICT">SESSION_CONFLICT</option>
            <option value="DUPLICATE_SUBMISSION">DUPLICATE_SUBMISSION</option>
          </select>
        </div>

        <div className="text-gray-400 font-mono">
          Showing <strong className="text-red-400">{violations.length}</strong> of {totalCount} violation events
        </div>
      </div>

      {/* Violations Table */}
      <div className="math-card overflow-hidden border border-cyber-border">
        {loading ? (
          <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>FETCHING SECURITY AUDIT LOG FROM NESTJS...</span>
          </div>
        ) : violations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 text-gray-400 space-y-1">
            <div className="font-bold text-gray-300">NO VIOLATION EVENTS FOUND</div>
            <p className="text-gray-500 text-[11px] font-mono">
              No anti-cheat security flags match the selected criteria on the NestJS backend database.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] border-b border-cyber-border font-mono">
                  <tr>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Violation Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Authoritative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {violations.map((v) => {
                    const isCritical = v.severity === 'CRITICAL';
                    return (
                      <tr
                        key={v.id}
                        className={`transition ${
                          isCritical
                            ? 'bg-red-950/40 border-l-4 border-l-red-600 hover:bg-red-950/60'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold">
                          <span className="font-mono text-red-400">{v.teamCode}</span>{' '}
                          <span className="text-gray-300 font-normal">({v.teamName})</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <ViolationTypeBadge type={v.type} />
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <ViolationSeverityBadge severity={v.severity} />
                        </td>
                        <td className="py-3.5 px-4 text-cyan-300 font-mono">Stage #{v.routeStepOrder || 'N/A'}</td>
                        <td className="py-3.5 px-4 text-gray-300 max-w-xs">{v.details}</td>
                        <td className="py-3.5 px-4 text-gray-400 text-[11px] font-mono">{formatDate(v.timestamp)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{v.actionTaken || 'LOGGED'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-900 border-t border-cyber-border flex items-center justify-between font-mono">
              <div className="text-gray-400 text-[11px]">
                Page {page} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>PREV</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded disabled:opacity-40 flex items-center gap-1"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
