'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Lock, Loader2, Eye } from 'lucide-react';
import { MOCK_CHALLENGES } from '@/lib/mock/mockData';
import { AdminSecretNotice } from '@/components/ui/BackendBanner';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { challengesApi, isMockMode } from '@/lib/api';
import { Challenge, CreateChallengeDTO } from '@/types';

export default function ChallengesPage() {
  const mock = isMockMode();
  const [challenges, setChallenges] = useState<Challenge[]>(mock ? MOCK_CHALLENGES : []);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const [challengeDTO, setChallengeDTO] = useState<CreateChallengeDTO>({
    title: 'Matrix Determinant Cipher',
    question: 'Calculate the determinant of matrix M = [[3, 7], [2, 9]]. Submit your integer answer.',
    answer: '13',
    type: 'NUMERIC',
    timeLimitSeconds: 300,
    baseScore: 100,
    bonusScore: 50,
    penalty: 20,
    active: true,
  });

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    const res = await challengesApi.getChallengesList();
    setLoading(false);

    if (res.success && res.data) {
      setChallenges(res.data);
      if (res.message) setNotice(res.message);
    } else if (res.error) {
      setError(res.error);
      setStatusCode(res.statusCode);
      setChallenges([]);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side UX Validation
    if (!challengeDTO.title?.trim() || !challengeDTO.question?.trim() || !challengeDTO.answer?.trim()) {
      setError('Title, Question text, and Authoritative Answer Key are required fields.');
      return;
    }
    if ((challengeDTO.timeLimitSeconds ?? 0) <= 0) {
      setError('Time limit must be a positive integer greater than 0 seconds.');
      return;
    }
    if ((challengeDTO.baseScore ?? 0) < 0 || (challengeDTO.penalty ?? 0) < 0) {
      setError('Base score and penalty values cannot be negative numbers.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await challengesApi.createChallenge(challengeDTO);
    setSubmitting(false);
    setIsModalOpen(false);

    if (res.success && res.data) {
      setNotice(`Challenge '${res.data.title}' created via POST /admin/challenges.`);
      fetchChallenges();
    } else {
      setError(res.error || 'Failed to save challenge. (Backend blocks edits if teams have already attempted).');
      setStatusCode(res.statusCode);
    }
  };

  const handleInspectChallenge = async (id: string) => {
    setError(null);
    const res = await challengesApi.getChallengeById(id);
    if (res.success && res.data) {
      setSelectedChallenge(res.data);
    } else {
      setError(res.error || 'Failed to fetch challenge details.');
      setStatusCode(res.statusCode);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            Math Challenges Repository
          </h1>
          <p className="text-gray-400 mt-1">
            Authoritative question repository. Correctness is evaluated strictly server-side on NestJS.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE MATH CHALLENGE</span>
        </button>
      </div>

      <AdminSecretNotice />

      <ApiErrorMessage error={error} statusCode={statusCode} onRetry={fetchChallenges} />

      {notice && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded text-cyan-300 font-mono">
          {notice}
        </div>
      )}

      {/* Challenges Table */}
      <div className="math-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Fetching Math Challenges...</span>
          </div>
        ) : challenges.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 text-gray-400">
            No math challenges found. Click 'CREATE MATH CHALLENGE' to register one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] border-b border-cyber-border font-mono">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Question Preview</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Time Limit</th>
                  <th className="py-3 px-4">Base Score</th>
                  <th className="py-3 px-4">Bonus</th>
                  <th className="py-3 px-4">Penalty</th>
                  <th className="py-3 px-4 text-purple-300">Admin Answer (Secret)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {challenges.map((chal) => (
                  <tr key={chal.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-bold text-gray-200">{chal.title}</td>
                    <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{chal.question}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className="bg-slate-800 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded text-[10px]">
                        {chal.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono">{chal.timeLimitSeconds}s</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">+{chal.baseScore}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">+{chal.bonusScore}</td>
                    <td className="py-3 px-4 font-mono text-red-400">-{chal.penalty}</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-300 bg-purple-950/30">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-purple-400 shrink-0" />
                        <span>{chal.answer}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleInspectChallenge(chal.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded border border-slate-700 transition"
                        title="Fetch Challenge (GET /admin/challenges/:id)"
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

      {/* Inspect Challenge Modal */}
      <Modal
        isOpen={!!selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
        title={`CHALLENGE DETAILS: ${selectedChallenge?.title}`}
        requiredEndpoint={`/admin/challenges/${selectedChallenge?.id}`}
        method="GET"
      >
        {selectedChallenge && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 p-4 rounded border border-slate-800 space-y-2">
              <div className="text-gray-400 text-[10px] font-mono">QUESTION TEXT:</div>
              <div className="text-gray-100 font-semibold leading-relaxed">{selectedChallenge.question}</div>
            </div>

            <div className="p-3 bg-purple-950/60 border border-purple-800 rounded font-mono">
              <span className="text-purple-300 font-bold block mb-1">AUTHORITATIVE ANSWER KEY (ADMIN ONLY):</span>
              <span className="text-base font-black text-purple-200">{selectedChallenge.answer}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-gray-400 block">TYPE</span>
                <span className="text-cyan-400 font-bold">{selectedChallenge.type}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-gray-400 block">TIME LIMIT</span>
                <span className="text-gray-200 font-bold">{selectedChallenge.timeLimitSeconds}s</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-gray-400 block">BASE SCORE</span>
                <span className="text-emerald-400 font-bold">+{selectedChallenge.baseScore}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-gray-400 block">PENALTY</span>
                <span className="text-red-400 font-bold">-{selectedChallenge.penalty}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-cyber-border">
              <button
                onClick={() => setSelectedChallenge(null)}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Challenge Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="CREATE MATH CHALLENGE (POST /admin/challenges)"
        requiredEndpoint="/admin/challenges"
        method="POST"
      >
        <form onSubmit={handleSaveChallenge} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">CHALLENGE TITLE</label>
            <input
              type="text"
              value={challengeDTO.title}
              onChange={(e) => setChallengeDTO({ ...challengeDTO, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
              placeholder="e.g. Matrix Determinant Cipher"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">QUESTION TEXT</label>
            <textarea
              value={challengeDTO.question}
              onChange={(e) => setChallengeDTO({ ...challengeDTO, question: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
              placeholder="Formulate the challenge question clearly for participants..."
              required
            />
          </div>

          <div className="p-3 bg-purple-950/60 border border-purple-800 rounded space-y-2">
            <label className="block font-bold text-purple-300 flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>AUTHORITATIVE ANSWER KEY (ADMIN-ONLY SECRET)</span>
            </label>
            <input
              type="text"
              value={challengeDTO.answer}
              onChange={(e) => setChallengeDTO({ ...challengeDTO, answer: e.target.value })}
              className="w-full bg-slate-950 border border-purple-800 rounded py-2 px-3 text-purple-200 font-mono font-bold"
              placeholder="Exact expected answer string"
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div>
              <label className="block text-gray-400 mb-1 font-sans font-semibold">TYPE</label>
              <select
                value={challengeDTO.type}
                onChange={(e) => setChallengeDTO({ ...challengeDTO, type: e.target.value as Challenge['type'] })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-2 text-gray-200"
              >
                <option value="NUMERIC">NUMERIC</option>
                <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
                <option value="FORMULA">FORMULA</option>
                <option value="ALGEBRA">ALGEBRA</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-sans font-semibold">TIME (SEC)</label>
              <input
                type="number"
                min={1}
                value={challengeDTO.timeLimitSeconds}
                onChange={(e) => setChallengeDTO({ ...challengeDTO, timeLimitSeconds: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-sans font-semibold">BASE SCORE</label>
              <input
                type="number"
                min={0}
                value={challengeDTO.baseScore}
                onChange={(e) => setChallengeDTO({ ...challengeDTO, baseScore: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-sans font-semibold">PENALTY</label>
              <input
                type="number"
                min={0}
                value={challengeDTO.penalty}
                onChange={(e) => setChallengeDTO({ ...challengeDTO, penalty: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyber-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
              <span>SAVE CHALLENGE</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
