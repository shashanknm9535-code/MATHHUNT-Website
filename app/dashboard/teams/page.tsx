'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, Plus, Loader2, KeyRound, ShieldAlert } from 'lucide-react';
import { TeamStatusBadge } from '@/components/ui/Badge';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { ScoreAdjustmentModal } from '@/components/ui/ScoreAdjustmentModal';
import { teamsApi, isMockMode } from '@/lib/api';
import { Team, CreateTeamDTO, TeamDetailDTO } from '@/types';
import { MOCK_TEAMS, MOCK_EVENT } from '@/lib/mock/mockData';
import { useAuth } from '@/lib/auth/AuthContext';

export default function TeamsPage() {
  const mock = isMockMode();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [teams, setTeams] = useState<Team[]>(mock ? MOCK_TEAMS : []);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<TeamDetailDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // SUPER_ADMIN operation state
  const [opModalTarget, setOpModalTarget] = useState<Team | null>(null);

  const [newTeamDTO, setNewTeamDTO] = useState<CreateTeamDTO>({
    eventId: MOCK_EVENT.id,
    code: 'MH-088',
    name: 'Euler Knights',
    pin: '7890',
    isActive: true,
  });

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    const res = await teamsApi.getTeamsList();
    setLoading(false);
    if (res.success && res.data) {
      setTeams(res.data);
      if (res.message) setNotice(res.message);
    } else if (res.error) {
      setError(res.error);
      setStatusCode(res.statusCode);
      setTeams([]);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleInspectTeam = async (id: string) => {
    setLoadingDetail(true);
    setError(null);
    const res = await teamsApi.getTeamById(id);
    setLoadingDetail(false);

    if (res.success && res.data) {
      setSelectedTeamDetail(res.data);
    } else {
      setError(res.error || 'Failed to fetch team details.');
      setStatusCode(res.statusCode);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await teamsApi.createTeam(newTeamDTO);
    setSubmitting(false);
    setShowCreateModal(false);

    if (res.success && res.data) {
      setNotice(`Team '${res.data.code}' created. Security PIN has been hashed and hidden.`);
      fetchTeams();
    } else {
      setError(res.error || 'Failed to register team.');
      setStatusCode(res.statusCode);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (t.code?.toLowerCase().includes(searchLower) ?? false) ||
      (t.name?.toLowerCase().includes(searchLower) ?? false) ||
      (t.members && t.members.some((m) => m.name?.toLowerCase().includes(searchLower) ?? false));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Registered Teams Roster
          </h1>
          <p className="text-gray-400 mt-1">
            Register teams, inspect roster profiles, and manage participating teams.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER NEW TEAM</span>
        </button>
      </div>

      <ApiErrorMessage error={error} statusCode={statusCode} onRetry={fetchTeams} />

      {notice && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded text-cyan-300 font-mono">
          {notice}
        </div>
      )}

      {/* Controls Bar: Search & Filter */}
      <div className="math-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Code (MH-017), Name, Member..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-gray-200 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DISQUALIFIED">DISQUALIFIED</option>
          </select>
        </div>
      </div>

      {/* Teams Table */}
      <div className="math-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Fetching Registered Teams...</span>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 text-gray-400">
            No team records match the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] border-b border-cyber-border font-mono">
                <tr>
                  <th className="py-3 px-4">Team Code</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Assigned Route</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-bold text-blue-400 font-mono">{team.code}</td>
                    <td className="py-3 px-4 text-gray-200 font-semibold">{team.name}</td>
                    <td className="py-3 px-4 text-gray-400">{team.assignedRouteName || 'Unassigned'}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-800 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                        Stage {team.currentStepIndex || 1} / {team.totalSteps || 7}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{team.score || 0} pts</td>
                    <td className="py-3 px-4 font-mono">
                      {team.violationsCount > 0 ? (
                        <span className="text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                          {team.violationsCount} Alert{team.violationsCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <TeamStatusBadge status={team.status || 'ACTIVE'} />
                    </td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                      {isSuperAdmin && (
                        <button
                          onClick={() => setOpModalTarget(team)}
                          className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded border border-amber-800 transition text-[10px] font-mono font-bold flex items-center gap-1"
                          title="SUPER_ADMIN Operations (Score Adjustment / Force Status)"
                        >
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          <span>OPERATIONS</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleInspectTeam(team.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded border border-slate-700 transition"
                        title="Inspect Team (GET /admin/teams/:id)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Details Modal (GET /admin/teams/:id) */}
      <Modal
        isOpen={!!selectedTeamDetail || loadingDetail}
        onClose={() => setSelectedTeamDetail(null)}
        title={selectedTeamDetail ? `TEAM INSPECTION: ${selectedTeamDetail.code} (${selectedTeamDetail.name})` : 'LOADING...'}
        requiredEndpoint={`/admin/teams/${selectedTeamDetail?.id || ''}`}
        method="GET"
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center p-6 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>FETCHING TEAM DETAILS...</span>
          </div>
        ) : selectedTeamDetail ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-900 p-4 rounded border border-slate-800">
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">TEAM CODE:</span>
                <span className="text-sm font-bold text-blue-400 font-mono">{selectedTeamDetail.code}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">GAME SESSION STATUS:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {selectedTeamDetail.gameSession?.status || 'ACTIVE'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">EVENT ID:</span>
                <span className="text-gray-200 font-mono text-[10px]">{selectedTeamDetail.eventId}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">TOTAL SCORE:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {selectedTeamDetail.gameSession?.totalScore || 0} Points
                </span>
              </div>
            </div>

            {selectedTeamDetail._count && (
              <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded border border-slate-800 text-gray-300 font-mono text-[11px]">
                <span>Violations Recorded: <strong className="text-red-400">{selectedTeamDetail._count.violations || 0}</strong></span>
                <span>Score Events: <strong className="text-cyan-400">{selectedTeamDetail._count.scoreEvents || 0}</strong></span>
              </div>
            )}

            <div>
              <h4 className="font-bold text-gray-300 uppercase mb-2">ROSTER MEMBERS</h4>
              {selectedTeamDetail.members && selectedTeamDetail.members.length > 0 ? (
                <div className="space-y-2">
                  {selectedTeamDetail.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded"
                    >
                      <div>
                        <div className="font-bold text-gray-200">{member.name}</div>
                        <div className="text-[10px] text-gray-400">{member.role}</div>
                      </div>
                      <span className="text-cyan-400 text-[11px] font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                        USN: {member.studentId || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-900 text-gray-500 rounded text-center">No member profiles attached yet.</div>
              )}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-cyber-border">
              <button
                onClick={() => setSelectedTeamDetail(null)}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
              >
                CLOSE
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* SUPER_ADMIN Score Adjustment & Status Override Modal */}
      {opModalTarget && (
        <ScoreAdjustmentModal
          isOpen={!!opModalTarget}
          onClose={() => setOpModalTarget(null)}
          teamId={opModalTarget.id}
          teamCode={opModalTarget.code}
          teamName={opModalTarget.name}
          currentScore={opModalTarget.score || 0}
          onSuccess={() => {
            setNotice(`Operation executed for ${opModalTarget.code}. Live state refreshed.`);
            fetchTeams();
          }}
        />
      )}

      {/* Register Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="REGISTER NEW TEAM (POST /admin/teams)"
        requiredEndpoint="/admin/teams"
        method="POST"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded text-amber-200 flex items-start gap-2 text-[11px]">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>SECURITY PIN NOTICE: The PIN is used by teams for activation. Once registered, PIN is hashed on backend and NEVER displayed again.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">TEAM CODE</label>
              <input
                type="text"
                value={newTeamDTO.code}
                onChange={(e) => setNewTeamDTO({ ...newTeamDTO, code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono font-bold"
                placeholder="MH-001"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">SECURITY PIN (4-DIGIT)</label>
              <input
                type="password"
                value={newTeamDTO.pin}
                onChange={(e) => setNewTeamDTO({ ...newTeamDTO, pin: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono"
                placeholder="1234"
                maxLength={6}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">TEAM NAME</label>
            <input
              type="text"
              value={newTeamDTO.name}
              onChange={(e) => setNewTeamDTO({ ...newTeamDTO, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
              placeholder="Alpha Vectors"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">EVENT ID</label>
            <input
              type="text"
              value={newTeamDTO.eventId}
              onChange={(e) => setNewTeamDTO({ ...newTeamDTO, eventId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono text-[11px]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyber-border">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>REGISTER TEAM</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
