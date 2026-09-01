'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Radio, Users, ShieldAlert, Clock, RefreshCw, Eye, Loader2, Award, AlertCircle } from 'lucide-react';
import { TeamStatusBadge, ViolationTypeBadge } from '@/components/ui/Badge';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { liveApi, eventApi, isMockMode } from '@/lib/api';
import { LiveMonitoringData, LiveTeamDetail, Event } from '@/types';
import { usePolling } from '@/lib/hooks/usePolling';
import { formatDate } from '@/lib/utils';
import { MOCK_EVENT } from '@/lib/mock/mockData';

export default function LiveControlPage() {
  const mock = isMockMode();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [liveData, setLiveData] = useState<LiveMonitoringData | null>(null);
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<LiveTeamDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [error, setError] = useState<string | null>(null);
  const [staleData, setStaleData] = useState<boolean>(false);
  const [lastPolled, setLastPolled] = useState<string>('');

  // Fetch event list for dropdown selection
  useEffect(() => {
    const initEvents = async () => {
      const res = await eventApi.listEvents(1, 20);
      if (res.success && res.data?.items?.length) {
        setEvents(res.data.items);
        setSelectedEventId(res.data.items[0].id);
      } else {
        setEvents([MOCK_EVENT]);
        setSelectedEventId(MOCK_EVENT.id);
      }
    };
    initEvents();
  }, []);

  const fetchLiveState = useCallback(async () => {
    if (!selectedEventId) return;
    setError(null);

    const res = await liveApi.getLiveMonitoring(selectedEventId);
    setLoading(false);

    if (res.success && res.data) {
      setLiveData(res.data);
      setStaleData(false);
      setLastPolled(new Date().toLocaleTimeString());
    } else {
      setStaleData(true);
      setError(res.error || 'Failed to fetch live monitoring data from backend.');
    }
  }, [selectedEventId]);

  const pollingInterval = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS || '5000', 10);
  usePolling(fetchLiveState, pollingInterval, !!selectedEventId);

  const handleInspectTeam = async (teamId: string) => {
    setLoadingDetail(true);
    setError(null);
    const res = await liveApi.getLiveTeamDetail(teamId);
    setLoadingDetail(false);

    if (res.success && res.data) {
      setSelectedTeamDetail(res.data);
    } else {
      setError(res.error || 'Failed to fetch detailed team monitoring data.');
    }
  };

  // Helper to detect >30 min inactivity
  const isInactiveOver30Min = (lastActivityStr?: string) => {
    if (!lastActivityStr) return false;
    const diffMs = Date.now() - new Date(lastActivityStr).getTime();
    return diffMs > 30 * 60 * 1000;
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            Live Competition Command Console
          </h1>
          <p className="text-gray-400 mt-1">
            Authoritative real-time event & team monitoring matrix polling every {pollingInterval / 1000}s.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Event Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-gray-200">
            <span className="text-gray-400 font-mono">EVENT:</span>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setLoading(true);
              }}
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
            onClick={() => fetchLiveState()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700 flex items-center gap-1.5 transition font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>POLL NOW ({lastPolled || 'Syncing'})</span>
          </button>
        </div>
      </div>

      {/* Prominent Stale Data / Connection Alert Banner */}
      {staleData && (
        <div className="p-3.5 bg-red-950/80 border-2 border-red-700 rounded-lg text-red-200 flex items-center justify-between shadow-lg animate-pulse font-mono">
          <div className="flex items-center gap-2.5">
            <AlertOctagonIcon className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-extrabold text-red-300">STALE DATA — BACKEND CONNECTION ISSUE</span>
              <p className="text-[11px] text-red-200/80 font-sans mt-0.5">
                Live polling request failed. Displayed team positions & scores may no longer be current. Retrying automatically...
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchLiveState()}
            className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white rounded font-bold text-[11px] shrink-0"
          >
            RECONNECT NOW
          </button>
        </div>
      )}

      <ApiErrorMessage error={error} onRetry={fetchLiveState} />

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="math-card p-4 flex items-center justify-between border-t-2 border-t-emerald-500">
          <div>
            <div className="text-gray-400">ACTIVE TEAMS</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              {liveData?.activeTeamsCount ?? 0}
            </div>
          </div>
          <Users className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="math-card p-4 flex items-center justify-between border-t-2 border-t-amber-500">
          <div>
            <div className="text-gray-400">PAUSED SESSIONS</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">
              {liveData?.pausedTeamsCount ?? 0}
            </div>
          </div>
          <Clock className="w-8 h-8 text-amber-500/30" />
        </div>

        <div className="math-card p-4 flex items-center justify-between border-t-2 border-t-blue-500">
          <div>
            <div className="text-gray-400">COMPLETED TEAMS</div>
            <div className="text-2xl font-black text-blue-400 mt-0.5">
              {liveData?.completedTeamsCount ?? 0}
            </div>
          </div>
          <Award className="w-8 h-8 text-blue-500/30" />
        </div>

        <div className="math-card p-4 flex items-center justify-between border-t-2 border-t-red-500">
          <div>
            <div className="text-gray-400">DISQUALIFIED</div>
            <div className="text-2xl font-black text-red-400 mt-0.5">
              {liveData?.disqualifiedTeamsCount ?? 0}
            </div>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-500/30" />
        </div>
      </div>

      {/* Main Team Monitoring Matrix */}
      <div className="math-card overflow-hidden border border-cyber-border">
        <div className="p-3 bg-slate-900 border-b border-cyber-border flex items-center justify-between">
          <div className="font-bold text-gray-200 flex items-center gap-2">
            <span>LIVE TEAM MONITORING MATRIX</span>
            <span className="text-[10px] text-gray-400 font-mono">
              ({liveData?.teams?.length || 0} teams registered)
            </span>
          </div>

          <span className="text-[10px] bg-slate-800 text-gray-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
            HTTP Polling ({pollingInterval / 1000}s)
          </span>
        </div>

        {loading && !liveData ? (
          <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>FETCHING LIVE EVENT MONITORING FROM NESTJS...</span>
          </div>
        ) : !liveData?.teams || liveData.teams.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 text-gray-400">
            No active teams found for selected event ({selectedEventId}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-gray-400 uppercase text-[10px] border-b border-cyber-border font-mono">
                <tr>
                  <th className="py-3 px-4">TEAM CODE & NAME</th>
                  <th className="py-3 px-4">CURRENT LOCATION</th>
                  <th className="py-3 px-4">STAGE PROGRESS</th>
                  <th className="py-3 px-4">GAME STATUS</th>
                  <th className="py-3 px-4">SCORE</th>
                  <th className="py-3 px-4">VIOLATIONS</th>
                  <th className="py-3 px-4">LAST ACTIVITY</th>
                  <th className="py-3 px-4 text-right">DRILLDOWN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {liveData.teams.map((t) => {
                  const inactiveAlert = isInactiveOver30Min(t.lastActivityAt);

                  return (
                    <tr
                      key={t.id}
                      className={`transition ${
                        inactiveAlert
                          ? 'bg-amber-950/30 border-l-4 border-l-amber-500 hover:bg-amber-950/40'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-blue-400 font-mono">{t.code}</div>
                        <div className="font-semibold text-gray-300 text-[11px]">{t.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-cyan-300 font-semibold">
                        {t.currentLocationName || 'Checkpoint'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-800 text-gray-200 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                          Stage {t.currentStepIndex || 1} / {t.totalSteps || 7}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <TeamStatusBadge status={t.status || 'ACTIVE'} />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        {t.score || 0}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {t.violationsCount > 0 ? (
                          <span className="text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                            {t.violationsCount} Alert{t.violationsCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-[11px] font-mono">
                        <div>{formatDate(t.lastActivityAt)}</div>
                        {inactiveAlert && (
                          <span className="text-[9px] bg-amber-950 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-800 inline-flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            INACTIVE &gt;30m
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInspectTeam(t.id)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition"
                          title="Drilldown (GET /admin/live/teams/:id)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Drill-down Modal (GET /admin/live/teams/:id) */}
      <Modal
        isOpen={!!selectedTeamDetail || loadingDetail}
        onClose={() => setSelectedTeamDetail(null)}
        title={
          selectedTeamDetail
            ? `TEAM DRILLDOWN MONITORING: ${selectedTeamDetail.code} (${selectedTeamDetail.name})`
            : 'LOADING TEAM MONITORING...'
        }
        requiredEndpoint={`/admin/live/teams/${selectedTeamDetail?.id || ''}`}
        method="GET"
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center p-6 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>FETCHING AUTHORITATIVE TEAM DETAILS FROM NESTJS...</span>
          </div>
        ) : selectedTeamDetail ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-900 p-4 rounded border border-slate-800">
              <div>
                <span className="text-gray-400 block font-mono">TEAM CODE & NAME:</span>
                <span className="text-sm font-bold text-blue-400">
                  {selectedTeamDetail.code} — {selectedTeamDetail.name}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono">GAME SESSION STATUS:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {selectedTeamDetail.gameSession?.status || 'ACTIVE'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono">TOTAL SCORE:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {selectedTeamDetail.gameSession?.totalScore || 0} Points
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono">RECORDED VIOLATIONS:</span>
                <span className="text-sm font-bold text-red-400 font-mono">
                  {selectedTeamDetail._count?.violations || selectedTeamDetail.violations?.length || 0}
                </span>
              </div>
            </div>

            {/* Member Roster */}
            <div>
              <h4 className="font-bold text-gray-300 uppercase mb-2">TEAM MEMBERS ROSTER</h4>
              {selectedTeamDetail.members && selectedTeamDetail.members.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedTeamDetail.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded"
                    >
                      <div>
                        <div className="font-bold text-gray-200">{m.name}</div>
                        <div className="text-[10px] text-gray-400">{m.role}</div>
                      </div>
                      <span className="text-cyan-400 font-mono text-[11px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                        USN: {m.studentId || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-900 text-gray-500 rounded text-center">
                  No roster members attached.
                </div>
              )}
            </div>

            {/* Violations Log */}
            {selectedTeamDetail.violations && selectedTeamDetail.violations.length > 0 && (
              <div>
                <h4 className="font-bold text-red-400 uppercase mb-2">TEAM SECURITY VIOLATIONS</h4>
                <div className="space-y-2">
                  {selectedTeamDetail.violations.map((v) => (
                    <div key={v.id} className="p-2.5 bg-red-950/30 border border-red-900/60 rounded">
                      <div className="flex items-center justify-between font-mono">
                        <ViolationTypeBadge type={v.type} />
                        <span className="text-[10px] text-gray-400">{formatDate(v.timestamp)}</span>
                      </div>
                      <p className="text-gray-300 mt-1">{v.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-cyber-border">
              <button
                onClick={() => setSelectedTeamDetail(null)}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
              >
                CLOSE DRILLDOWN
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function AlertOctagonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
