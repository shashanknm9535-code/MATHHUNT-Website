'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Play,
  Pause,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Radio,
  ArrowRight,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react';
import { EventStatusBadge, TeamStatusBadge, ViolationTypeBadge } from '@/components/ui/Badge';
import { MOCK_EVENT, MOCK_TEAMS, MOCK_VIOLATIONS } from '@/lib/mock/mockData';
import { formatDate } from '@/lib/utils';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { eventApi, teamsApi, violationsApi, isMockMode } from '@/lib/api';
import { Event, Team, Violation } from '@/types';
import { usePolling } from '@/lib/hooks/usePolling';
import { useAuth } from '@/lib/auth/AuthContext';

export default function OverviewDashboardPage() {
  const { isAuthenticated } = useAuth();
  const mock = isMockMode();
  const [event, setEvent] = useState<Event>(MOCK_EVENT);
  const [teams, setTeams] = useState<Team[]>(mock ? MOCK_TEAMS : []);
  const [violations, setViolations] = useState<Violation[]>(mock ? MOCK_VIOLATIONS : []);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = useCallback(async () => {
    setError(null);
    const [eventsRes, teamsRes, violRes] = await Promise.all([
      eventApi.listEvents(1, 1),
      teamsApi.getTeamsList(),
      violationsApi.getViolations(),
    ]);

    setLoading(false);

    if (eventsRes.success && eventsRes.data?.items?.length) {
      setEvent(eventsRes.data.items[0]);
    }
    if (teamsRes.success && teamsRes.data) {
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
    } else {
      setTeams([]);
    }
    if (violRes.success && violRes.data) {
      setViolations(Array.isArray(violRes.data.items) ? violRes.data.items : []);
    } else {
      setViolations([]);
    }
  }, []);

  const pollingInterval = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS || '5000', 10);
  usePolling(fetchOverviewData, pollingInterval, isAuthenticated || mock);

  const teamList = Array.isArray(teams) ? teams : [];
  const violationList = Array.isArray(violations) ? violations : [];

  const totalTeams = teamList.length;
  const activeTeams = teamList.filter((t) => t.status === 'ACTIVE' || t.status === 'SOLVING_MATH').length;
  const pausedTeams = teamList.filter((t) => t.status === 'PAUSED').length;
  const completedTeams = teamList.filter((t) => t.status === 'COMPLETED').length;
  const disqualifiedTeams = teamList.filter((t) => t.status === 'DISQUALIFIED').length;
  const totalViolations = violationList.length;

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Competition Overview Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time status monitoring for {event.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/live"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 transition shadow-lg font-mono"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>OPEN LIVE MONITOR</span>
          </Link>
          <Link
            href="/dashboard/event"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition"
          >
            <span>EVENT CONTROL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* Event Status Banner Card */}
      <div className="math-card p-5 border-l-4 border-l-emerald-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 font-mono">
            <span className="text-gray-400 uppercase tracking-wider text-[10px]">
              CURRENT EVENT LIFECYCLE:
            </span>
            <EventStatusBadge status={event.status} />
          </div>
          <h2 className="text-lg font-bold text-gray-100">{event.name}</h2>
          <div className="text-gray-400 flex items-center gap-4">
            <span>Org: {event.organization}</span>
            <span>•</span>
            <span className="font-mono">Started: {formatDate(event.startTime)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <Link
            href="/dashboard/event"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-lg border border-slate-700 font-bold transition"
          >
            MANAGE LIFECYCLE
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
        <div className="math-card p-4 space-y-2 border-t-2 border-t-blue-500">
          <div className="flex items-center justify-between text-gray-400">
            <span>TOTAL TEAMS</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTeams}</div>
          <div className="text-[10px] text-gray-500 font-sans">Registered Roster</div>
        </div>

        <div className="math-card p-4 space-y-2 border-t-2 border-t-emerald-500">
          <div className="flex items-center justify-between text-gray-400">
            <span>ACTIVE TEAMS</span>
            <Play className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeTeams}</div>
          <div className="text-[10px] text-emerald-500/80 font-sans">Solving Challenges</div>
        </div>

        <div className="math-card p-4 space-y-2 border-t-2 border-t-amber-500">
          <div className="flex items-center justify-between text-gray-400">
            <span>PAUSED TEAMS</span>
            <Pause className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pausedTeams}</div>
          <div className="text-[10px] text-amber-500/80 font-sans">Pending Action</div>
        </div>

        <div className="math-card p-4 space-y-2 border-t-2 border-t-indigo-500">
          <div className="flex items-center justify-between text-gray-400">
            <span>COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">{completedTeams}</div>
          <div className="text-[10px] text-indigo-400/80 font-sans">Finished Route</div>
        </div>

        <div className="math-card p-4 space-y-2 border-t-2 border-t-red-500">
          <div className="flex items-center justify-between text-gray-400">
            <span>DISQUALIFIED</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{disqualifiedTeams}</div>
          <div className="text-[10px] text-red-500/80 font-sans">Rule Violations</div>
        </div>

        <div className="math-card p-4 space-y-2 border-t-2 border-t-purple-500">
          <div className="flex items-center justify-between text-gray-400">
            <span>VIOLATIONS</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{totalViolations}</div>
          <div className="text-[10px] text-purple-400/80 font-sans">Security Logs</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Team Progress Summary */}
        <div className="lg:col-span-2 math-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <h3 className="font-bold text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Live Team Progress Summary
            </h3>
            <Link href="/dashboard/teams" className="text-blue-400 hover:underline">
              View All Teams →
            </Link>
          </div>

          {loading && teams.length === 0 ? (
            <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>SYNCING TEAM PROGRESS...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 text-gray-400 uppercase text-[10px] border-b border-cyber-border font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Progress</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teamList.map((team) => (
                    <tr key={team.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-200 font-mono">{team.code}</div>
                        <div className="text-[11px] text-gray-400">{team.name}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-400">{team.assignedRouteName || 'Unassigned'}</td>
                      <td className="py-3 px-3 text-cyan-300 font-semibold">{team.currentLocationName || 'Checkpoint'}</td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700 font-mono">
                          {team.currentStepIndex || 1} / {team.totalSteps || 7}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{team.score || 0}</td>
                      <td className="py-3 px-3 font-mono">
                        <TeamStatusBadge status={team.status || 'ACTIVE'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Violations Feed */}
        <div className="math-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <h3 className="font-bold text-gray-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Recent Violation Logs
            </h3>
            <Link href="/dashboard/violations" className="text-red-400 hover:underline">
              Log Details →
            </Link>
          </div>

          <div className="space-y-3">
            {violations.map((viol) => (
              <div
                key={viol.id}
                className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-red-400">{viol.teamCode}</span>
                  <ViolationTypeBadge type={viol.type} />
                </div>
                <p className="text-gray-300 text-[11px] leading-tight font-sans">{viol.details}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 font-mono">
                  <span>{formatDate(viol.timestamp)}</span>
                  <span className="text-amber-400 font-semibold">{viol.actionTaken}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
