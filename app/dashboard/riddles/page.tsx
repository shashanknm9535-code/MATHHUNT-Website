'use client';

import React, { useState, useEffect } from 'react';
import { Puzzle, Plus, MapPin, Loader2, Eye, Lock } from 'lucide-react';
import { MOCK_RIDDLES, MOCK_LOCATIONS } from '@/lib/mock/mockData';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { riddlesApi, locationsApi, isMockMode } from '@/lib/api';
import { Riddle, Location, CreateRiddleDTO } from '@/types';

export default function RiddlesPage() {
  const mock = isMockMode();
  const [riddles, setRiddles] = useState<Riddle[]>(mock ? MOCK_RIDDLES : []);
  const [locations, setLocations] = useState<Location[]>(mock ? MOCK_LOCATIONS : []);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRiddle, setSelectedRiddle] = useState<Riddle | null>(null);

  const [riddleDTO, setRiddleDTO] = useState<CreateRiddleDTO>({
    title: 'The Golden Ratio Threshold',
    question: 'I am irrational, approx 1.618, found in spiral shells and sacred shapes. Go where my statue stands on the 2nd floor math wing.',
    answer: 'Ramanujan Math Lab',
    destinationLocationId: MOCK_LOCATIONS[0].id,
    active: true,
  });

  const fetchRiddlesData = async () => {
    setLoading(true);
    setError(null);
    const [riddlesRes, locsRes] = await Promise.all([
      riddlesApi.getRiddlesList(),
      locationsApi.getLocationsList(),
    ]);
    setLoading(false);

    if (riddlesRes.success && riddlesRes.data) {
      setRiddles(riddlesRes.data);
      if (riddlesRes.message) setNotice(riddlesRes.message);
    } else if (riddlesRes.error) {
      setError(riddlesRes.error);
      setStatusCode(riddlesRes.statusCode);
      setRiddles([]);
    }

    if (locsRes.success && locsRes.data) {
      setLocations(locsRes.data);
      if (locsRes.data.length > 0 && !riddleDTO.destinationLocationId) {
        setRiddleDTO((prev) => ({ ...prev, destinationLocationId: locsRes.data![0].id }));
      }
    }
  };

  useEffect(() => {
    fetchRiddlesData();
  }, []);

  const handleSaveRiddle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await riddlesApi.createRiddle(riddleDTO);
    setSubmitting(false);
    setIsModalOpen(false);

    if (res.success && res.data) {
      setNotice(`Riddle '${res.data.title}' created via POST /admin/riddles.`);
      fetchRiddlesData();
    } else {
      setError(res.error || 'Failed to save riddle.');
      setStatusCode(res.statusCode);
    }
  };

  const handleInspectRiddle = async (id: string) => {
    setError(null);
    const res = await riddlesApi.getRiddleById(id);
    if (res.success && res.data) {
      setSelectedRiddle(res.data);
    } else {
      setError(res.error || 'Failed to fetch riddle details.');
      setStatusCode(res.statusCode);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-blue-400" />
            Riddles & Destination Mapping
          </h1>
          <p className="text-gray-400 mt-1">
            Create mathematical riddles guiding teams to their next physical checkpoint location.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE RIDDLE</span>
        </button>
      </div>

      <ApiErrorMessage error={error} statusCode={statusCode} onRetry={fetchRiddlesData} />

      {notice && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded text-cyan-300 font-mono">
          {notice}
        </div>
      )}

      {/* Riddles Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Fetching Destination Riddles...</span>
        </div>
      ) : riddles.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-800 text-gray-400">
          No riddles registered yet. Click 'CREATE RIDDLE' to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {riddles.map((rid) => (
            <div key={rid.id} className="math-card p-5 space-y-4 border-l-4 border-l-purple-500 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">{rid.title}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-gray-300 italic bg-slate-900/80 p-3 rounded border border-slate-800 leading-relaxed font-sans">
                  "{rid.question}"
                </p>
                <div className="text-gray-400 flex items-center gap-1.5 pt-1">
                  <Lock className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>Solution Phrase: <strong className="text-purple-200 font-mono">{rid.answer}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-cyber-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Next Location: {rid.destinationLocationName || rid.destinationLocationId || 'Campus Checkpoint'}</span>
                </div>

                <button
                  onClick={() => handleInspectRiddle(rid.id)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded border border-slate-700 transition"
                  title="Inspect Riddle (GET /admin/riddles/:id)"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Riddle Modal */}
      <Modal
        isOpen={!!selectedRiddle}
        onClose={() => setSelectedRiddle(null)}
        title={`RIDDLE INSPECTION: ${selectedRiddle?.title}`}
        requiredEndpoint={`/admin/riddles/${selectedRiddle?.id}`}
        method="GET"
      >
        {selectedRiddle && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 p-4 rounded border border-slate-800 space-y-2">
              <div className="text-gray-400 text-[10px] font-mono">RIDDLE TEXT:</div>
              <div className="text-gray-100 font-semibold italic leading-relaxed">"{selectedRiddle.question}"</div>
            </div>

            <div className="p-3 bg-purple-950/60 border border-purple-800 rounded font-mono">
              <span className="text-purple-300 font-bold block mb-1">AUTHORITATIVE SOLUTION PHRASE (ADMIN ONLY):</span>
              <span className="text-base font-black text-purple-200">{selectedRiddle.answer}</span>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-cyber-border">
              <button
                onClick={() => setSelectedRiddle(null)}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Riddle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="CREATE RIDDLE (POST /admin/riddles)"
        requiredEndpoint="/admin/riddles"
        method="POST"
      >
        <form onSubmit={handleSaveRiddle} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">RIDDLE TITLE</label>
            <input
              type="text"
              value={riddleDTO.title}
              onChange={(e) => setRiddleDTO({ ...riddleDTO, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
              placeholder="e.g. The Golden Ratio Threshold"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">RIDDLE TEXT / POEM</label>
            <textarea
              value={riddleDTO.question}
              onChange={(e) => setRiddleDTO({ ...riddleDTO, question: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
              placeholder="Provide the clue guiding teams to the next physical checkpoint..."
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">EXPECTED ANSWER KEY</label>
            <input
              type="text"
              value={riddleDTO.answer}
              onChange={(e) => setRiddleDTO({ ...riddleDTO, answer: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono font-bold"
              placeholder="Solution phrase"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">DESTINATION LOCATION MAPPING</label>
            <select
              value={riddleDTO.destinationLocationId}
              onChange={(e) => setRiddleDTO({ ...riddleDTO, destinationLocationId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.building || 'Campus Checkpoint'})
                </option>
              ))}
            </select>
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
              <span>SAVE RIDDLE</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
