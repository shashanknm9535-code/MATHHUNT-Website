'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, Medal, Loader2, RefreshCw } from 'lucide-react';
import { TeamStatusBadge } from '@/components/ui/Badge';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { leaderboardApi, isMockMode } from '@/lib/api';
import { LeaderboardItem } from '@/types';
import { useEvent } from '@/lib/auth/EventContext';

export default function LeaderboardPage() {
  const mock = isMockMode();
  const { events, selectedEventId, setSelectedEventId } = useEvent();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!selectedEventId) {
      setLoading(false);
      setLeaderboard([]);
      return;
    }
    setLoading(true);
    setError(null);

    const res = await leaderboardApi.getLeaderboard(selectedEventId);
    setLoading(false);

    if (res.success && res.data) {
      setLeaderboard(res.data);
    } else {
      setError(res.error || 'Failed to fetch authoritative leaderboard rankings from NestJS backend.');
      setLeaderboard([]);
    }
  }, [selectedEventId]);

  useEffect(() => {
    setLeaderboard([]);
    fetchLeaderboard();
  }, [selectedEventId, fetchLeaderboard]);

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Authoritative Competition Leaderboard
          </h1>
          <p className="text-gray-400 mt-1">
            Pre-computed score rankings & completion timings provided directly by NestJS backend database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono">
          {/* Event Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-gray-200">
            <span className="text-gray-400">EVENT:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-slate-900 text-gray-200">
                  {ev.name} ({ev.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchLeaderboard}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>REFRESH STANDINGS</span>
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} onRetry={fetchLeaderboard} />

      {/* Leaderboard Table */}
      <div className="math-card overflow-hidden border border-cyber-border">
        {loading ? (
          <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>FETCHING AUTHORITATIVE STANDINGS FROM NESTJS...</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 text-gray-400">
            No leaderboard standings available for selected event ({selectedEventId}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] border-b border-cyber-border font-mono">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Team Code & Name</th>
                  <th className="py-3.5 px-4">Authoritative Score</th>
                  <th className="py-3.5 px-4">Penalties</th>
                  <th className="py-3.5 px-4">Stage Progress</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leaderboard.map((item) => {
                  const rank = item.rank;
                  let rankBadge = (
                    <span className="font-bold text-gray-400 text-sm font-mono">#{rank}</span>
                  );

                  if (rank === 1) {
                    rankBadge = (
                      <div className="flex items-center justify-center gap-1 text-amber-400 font-extrabold text-base font-mono">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span>#1</span>
                      </div>
                    );
                  } else if (rank === 2) {
                    rankBadge = (
                      <div className="flex items-center justify-center gap-1 text-slate-300 font-extrabold text-base font-mono">
                        <Medal className="w-5 h-5 text-slate-300" />
                        <span>#2</span>
                      </div>
                    );
                  } else if (rank === 3) {
                    rankBadge = (
                      <div className="flex items-center justify-center gap-1 text-amber-600 font-extrabold text-base font-mono">
                        <Award className="w-5 h-5 text-amber-600" />
                        <span>#3</span>
                      </div>
                    );
                  }

                  return (
                    <tr
                      key={item.teamId}
                      className={`transition ${
                        rank === 1
                          ? 'bg-amber-950/20 hover:bg-amber-950/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-4 px-4 text-center">{rankBadge}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-sm text-gray-100 font-mono">{item.teamCode}</div>
                        <div className="text-[11px] text-gray-400">{item.teamName}</div>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <span className="text-base font-black text-emerald-400">
                          {item.score} PTS
                        </span>
                      </td>
                      <td className="py-4 px-4 text-red-400 font-bold font-mono">
                        {item.penalties ? `-${item.penalties}` : '0'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-slate-800 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                          Stage {item.completedSteps || 1} / {item.totalSteps || 7}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <TeamStatusBadge status={item.status || 'ACTIVE'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
