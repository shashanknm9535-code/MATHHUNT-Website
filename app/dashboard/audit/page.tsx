'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Loader2, ChevronLeft, ChevronRight, User, Filter } from 'lucide-react';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { auditApi, isMockMode } from '@/lib/api';
import { AuditLog } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AuditPage() {
  const mock = isMockMode();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogs, setTotalLogs] = useState<number>(0);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const action = actionFilter !== 'ALL' ? actionFilter : undefined;
    const res = await auditApi.getAuditLogs(page, 50, action);
    setLoading(false);

    if (res.success && res.data) {
      setAuditLogs(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalLogs(res.data.total || 0);
    } else {
      setError(res.error || 'Failed to fetch audit logs from NestJS backend.');
      setAuditLogs([]);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Administrative Audit Trail
          </h1>
          <p className="text-gray-400 mt-1">
            Authoritative, read-only system audit trail recording all admin control operations in PostgreSQL.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>REFRESH AUDIT LOG</span>
        </button>
      </div>

      <ApiErrorMessage error={error} onRetry={fetchAuditLogs} />

      {/* Filter Control Bar */}
      <div className="math-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 font-semibold">Filter by Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-indigo-500 font-mono font-bold"
          >
            <option value="ALL">All Action Types</option>
            <option value="EVENT_START">EVENT_START</option>
            <option value="EVENT_PAUSE">EVENT_PAUSE</option>
            <option value="SCORE_ADJUSTMENT">SCORE_ADJUSTMENT</option>
            <option value="FORCE_STATUS">FORCE_STATUS</option>
            <option value="QR_REGENERATE">QR_REGENERATE</option>
          </select>
        </div>

        <div className="text-gray-400 font-mono">
          Showing <strong className="text-indigo-400">{auditLogs.length}</strong> of {totalLogs} audit records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="math-card overflow-hidden border border-cyber-border">
        {loading ? (
          <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>FETCHING AUDIT LOGS FROM NESTJS...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 text-gray-400 space-y-1">
            <div className="font-bold text-gray-300">NO AUDIT LOG RECORDS FOUND</div>
            <p className="text-gray-500 text-[11px] font-mono">
              No administrative control operations have been logged matching criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] border-b border-cyber-border font-mono">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Target Type</th>
                    <th className="py-3 px-4">Target ID</th>
                    <th className="py-3 px-4">Operation Details</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold font-mono text-indigo-300">
                        <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-200 font-semibold">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>{log.adminUsername}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-cyan-400 font-semibold">{log.targetType}</td>
                      <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                        {log.targetId || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 max-w-sm">{log.details}</td>
                      <td className="py-3.5 px-4 text-gray-400 text-[11px] font-mono">{formatDate(log.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-900 border-t border-cyber-border flex items-center justify-between font-mono">
              <div className="text-gray-400 text-[11px]">
                Showing page {page} of {totalPages} ({totalLogs} audit records)
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
