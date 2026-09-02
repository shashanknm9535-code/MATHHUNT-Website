'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { reportsApi, isMockMode } from '@/lib/api';
import { ScoreReportData, EventReportData } from '@/types';
import { useEvent } from '@/lib/auth/EventContext';

export default function ReportsPage() {
  const mock = isMockMode();
  const { events, selectedEventId, setSelectedEventId } = useEvent();
  const [scoreReport, setScoreReport] = useState<ScoreReportData | null>(null);
  const [eventReport, setEventReport] = useState<EventReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!selectedEventId) {
      setLoading(false);
      setScoreReport(null);
      setEventReport(null);
      return;
    }
    setLoading(true);
    setError(null);

    const [scoreRes, eventRes] = await Promise.all([
      reportsApi.getScoreReport(selectedEventId),
      reportsApi.getEventReport(selectedEventId),
    ]);

    setLoading(false);

    if (scoreRes.success && scoreRes.data) {
      setScoreReport(scoreRes.data);
    } else {
      setError(scoreRes.error || 'Failed to fetch score report from backend.');
    }

    if (eventRes.success && eventRes.data) {
      setEventReport(eventRes.data);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Competition Reports & Statistical Analytics
          </h1>
          <p className="text-gray-400 mt-1">
            Authoritative score metrics & event summary reports (`GET /admin/reports/score`).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono">
          {/* Event Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-gray-200">
            <span className="text-gray-400">EVENT:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-slate-900 text-gray-200">
                  {ev.name} ({ev.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchReports}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>REFRESH REPORT</span>
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} onRetry={fetchReports} />

      {loading ? (
        <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>COMPILING AUTHORITATIVE REPORTS FROM NESTJS...</span>
        </div>
      ) : (
        <>
          {/* Event Summary Report Card */}
          {eventReport && (
            <div className="math-card p-5 space-y-4 border-l-4 border-l-cyan-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border pb-3">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-mono">EVENT REPORT SUMMARY</div>
                  <h2 className="text-base font-bold text-white mt-0.5">{eventReport.name}</h2>
                  <div className="text-gray-400">{eventReport.organization} • {eventReport.department}</div>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-gray-400">STATUS:</span>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                    {eventReport.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <span className="text-gray-400 block text-[10px]">REGISTERED TEAMS</span>
                  <span className="text-lg font-bold text-white">{eventReport.totalTeams}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <span className="text-gray-400 block text-[10px]">ACTIVE TEAMS</span>
                  <span className="text-lg font-bold text-emerald-400">{eventReport.activeTeams}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <span className="text-gray-400 block text-[10px]">COMPLETED TEAMS</span>
                  <span className="text-lg font-bold text-blue-400">{eventReport.completedTeams}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <span className="text-gray-400 block text-[10px]">RECORDED VIOLATIONS</span>
                  <span className="text-lg font-bold text-red-400">{eventReport.totalViolations}</span>
                </div>
              </div>
            </div>
          )}

          {/* Score Report Details */}
          {scoreReport ? (
            <div className="math-card p-5 space-y-4">
              <h3 className="font-bold text-gray-200 flex items-center gap-2 border-b border-cyber-border pb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Score Aggregations & Metrics (GET /admin/reports/score)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div className="bg-slate-900 p-3.5 rounded border border-slate-800">
                  <span className="text-gray-400 block text-[10px]">AVERAGE TEAM SCORE</span>
                  <span className="text-xl font-black text-cyan-400 mt-1 block">
                    {scoreReport.averageScore} PTS
                  </span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded border border-slate-800">
                  <span className="text-gray-400 block text-[10px]">HIGHEST SCORE</span>
                  <span className="text-xl font-black text-emerald-400 mt-1 block">
                    {scoreReport.highestScore} PTS
                  </span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded border border-slate-800">
                  <span className="text-gray-400 block text-[10px]">LOWEST SCORE</span>
                  <span className="text-xl font-black text-amber-400 mt-1 block">
                    {scoreReport.lowestScore} PTS
                  </span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded border border-slate-800">
                  <span className="text-gray-400 block text-[10px]">SCORE EVENTS LOGGED</span>
                  <span className="text-xl font-black text-purple-300 mt-1 block">
                    {scoreReport.totalScoreEvents} Events
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="math-card p-6 text-center text-gray-400 font-mono">
              Not available from backend for event {selectedEventId}.
            </div>
          )}
        </>
      )}
    </div>
  );
}
