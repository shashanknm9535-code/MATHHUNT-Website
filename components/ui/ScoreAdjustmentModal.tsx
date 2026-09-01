'use client';

import React, { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { operationsApi } from '@/lib/api';
import { TeamStatus } from '@/types';

interface ScoreAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamCode: string;
  teamName: string;
  currentScore: number;
  onSuccess: () => void;
}

export const ScoreAdjustmentModal: React.FC<ScoreAdjustmentModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamCode,
  teamName,
  currentScore,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'SCORE' | 'STATUS'>('SCORE');
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [forcedStatus, setForcedStatus] = useState<TeamStatus>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdjustScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Mandatory justification reason is required for SUPER_ADMIN operations.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await operationsApi.adjustScore(teamId, amount, reason);
    setSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Score adjustment failed.');
    }
  };

  const handleForceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Mandatory justification reason is required for SUPER_ADMIN operations.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await operationsApi.forceStatus(teamId, forcedStatus, reason);
    setSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Status override failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`SUPER ADMIN OPERATION: ${teamCode} (${teamName})`}
      requiredEndpoint={
        activeTab === 'SCORE'
          ? `/admin/operations/teams/${teamId}/score-adjustment`
          : `/admin/operations/teams/${teamId}/force-status`
      }
      method="POST"
      isDangerous
    >
      <div className="space-y-4 font-mono text-xs">
        <div className="p-3 bg-amber-950/60 border border-amber-800 rounded text-amber-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">SUPER_ADMIN RESTRICTED ACTION:</span>
            <p className="mt-0.5 text-[11px] opacity-90">
              Operations are logged directly into NestJS PostgreSQL audit logs. Mandatory reason is required.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-cyber-border gap-2">
          <button
            onClick={() => setActiveTab('SCORE')}
            className={`py-2 px-4 font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'SCORE'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            SCORE ADJUSTMENT
          </button>
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`py-2 px-4 font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'STATUS'
                ? 'border-red-400 text-red-300 bg-slate-900'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            FORCE TEAM STATUS
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950 border border-red-800 rounded text-red-300 text-[11px]">
            {error}
          </div>
        )}

        {activeTab === 'SCORE' ? (
          <form onSubmit={handleAdjustScore} className="space-y-4">
            <div className="bg-slate-900 p-3 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-gray-400">CURRENT TEAM SCORE:</span>
              <span className="text-base font-black text-emerald-400">{currentScore} PTS</span>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">SCORE DELTA AMOUNT (+/- integer)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-bold"
                placeholder="e.g. 15 or -10"
                required
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Resulting score will be: {currentScore + amount} PTS
              </span>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-bold text-amber-300">
                MANDATORY REASON / JUSTIFICATION
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
                placeholder="e.g. Judge scoring correction for challenge stage 3"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyber-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold transition flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>EXECUTE SCORE ADJUSTMENT</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForceStatus} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">TARGET STATUS OVERRIDE</label>
              <select
                value={forcedStatus}
                onChange={(e) => setForcedStatus(e.target.value as TeamStatus)}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-bold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-bold text-red-400">
                MANDATORY REASON / JUSTIFICATION
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
                placeholder="e.g. Security override following manual inspection"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyber-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>EXECUTE FORCE STATUS</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
