'use client';

import React, { useState, useEffect } from 'react';
import { PlaySquare, Play, Pause, Square, RotateCcw, AlertTriangle, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { EventStatusBadge } from '@/components/ui/Badge';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { eventApi, isMockMode } from '@/lib/api';
import { Event, CreateEventDTO } from '@/types';
import { formatDate } from '@/lib/utils';
import { MOCK_EVENT } from '@/lib/mock/mockData';

export default function EventControlPage() {
  const mock = isMockMode();
  const [event, setEvent] = useState<Event>(MOCK_EVENT);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [selectedAction, setSelectedAction] = useState<'ready' | 'start' | 'pause' | 'resume' | 'complete' | 'cancel' | null>(null);
  const [eventConfirmName, setEventConfirmName] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const [newEventDTO, setNewEventDTO] = useState<CreateEventDTO>({
    name: 'MATHHUNT 2026 Grand Championship',
    organization: 'MATHLITE CLUB',
    department: 'MATHEMATICS DEPARTMENT',
    college: 'MVJ COLLEGE OF ENGINEERING',
    description: 'Annual flagship competitive mathematics treasure hunt.',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 14400000).toISOString(),
    status: 'DRAFT',
  });

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const res = await eventApi.listEvents(1, 20);
    setLoading(false);
    if (res.success && res.data && res.data.items && res.data.items.length > 0) {
      setEvent(res.data.items[0]);
    } else if (res.error) {
      setError(res.error);
      setStatusCode(res.statusCode);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const isDestructive = selectedAction === 'cancel' || selectedAction === 'complete';

  const confirmAction = async () => {
    if (!selectedAction || !event?.id) return;
    if (isDestructive && eventConfirmName !== event.name) return;

    setSubmitting(true);
    setError(null);
    setActionNotice(null);

    const res = await eventApi.transitionStatus(event.id, selectedAction);
    setSubmitting(false);
    setSelectedAction(null);
    setEventConfirmName('');

    if (res.success && res.data) {
      setEvent(res.data);
      setActionNotice(`Event lifecycle transition to '${selectedAction.toUpperCase()}' succeeded.`);
      fetchEvents();
    } else {
      setError(res.error || `Transition to ${selectedAction} failed.`);
      setStatusCode(res.statusCode);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await eventApi.createEvent(newEventDTO);
    setSubmitting(false);
    setShowCreateModal(false);

    if (res.success && res.data) {
      setEvent(res.data);
      setActionNotice(`Created new event '${res.data.name}' successfully.`);
      fetchEvents();
    } else {
      setError(res.error || 'Failed to create event.');
      setStatusCode(res.statusCode);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <PlaySquare className="w-5 h-5 text-blue-400" />
            Event Lifecycle Control Center
          </h1>
          <p className="text-gray-400 mt-1">
            Master control panel for starting, pausing, resuming, or concluding the MATHHUNT competition.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW EVENT</span>
        </button>
      </div>

      <ApiErrorMessage error={error} statusCode={statusCode} onRetry={fetchEvents} />

      {actionNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-lg text-emerald-300 font-mono">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>ACTION ACKNOWLEDGMENT:</span>
          </div>
          <div className="mt-0.5">{actionNotice}</div>
        </div>
      )}

      {/* Main Event Card */}
      <div className="math-card p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>FETCHING EVENT STATE FROM NESTJS...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border pb-4">
              <div className="space-y-1">
                <div className="text-gray-400 uppercase text-[10px] tracking-wider font-mono">
                  ACTIVE COMPETITION EVENT
                </div>
                <h2 className="text-xl font-extrabold text-white">{event.name}</h2>
                <div className="text-cyan-400">
                  {event.organization} • {event.department} • {event.college}
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="text-gray-400">CURRENT STATUS:</span>
                <EventStatusBadge status={event.status} />
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">EVENT ID:</span>
                <span className="font-bold text-gray-200 font-mono">{event.id}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">SCHEDULED START TIME:</span>
                <span className="font-bold text-gray-200 font-mono">{formatDate(event.startTime)}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">SCHEDULED END TIME:</span>
                <span className="font-bold text-gray-200 font-mono">{formatDate(event.endTime)}</span>
              </div>
            </div>

            {/* Control Action Buttons */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-gray-300 uppercase tracking-wider font-mono">
                LIFECYCLE STATE TRANSITION ACTIONS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 font-mono">
                {/* Ready */}
                <button
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('ready');
                  }}
                  disabled={submitting || event.status === 'READY'}
                  className="p-3 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  <div className="font-bold">SET READY</div>
                  <span className="text-[9px] bg-blue-900/90 text-blue-200 px-1 py-0.5 rounded">
                    POST /ready
                  </span>
                </button>

                {/* Start */}
                <button
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('start');
                  }}
                  disabled={submitting || event.status === 'LIVE'}
                  className="p-3 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <Play className="w-5 h-5 text-emerald-400" />
                  <div className="font-bold">START LIVE</div>
                  <span className="text-[9px] bg-emerald-900/90 text-emerald-200 px-1 py-0.5 rounded">
                    POST /start
                  </span>
                </button>

                {/* Pause */}
                <button
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('pause');
                  }}
                  disabled={submitting || event.status === 'PAUSED'}
                  className="p-3 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <Pause className="w-5 h-5 text-amber-400" />
                  <div className="font-bold">PAUSE EVENT</div>
                  <span className="text-[9px] bg-amber-900/90 text-amber-200 px-1 py-0.5 rounded">
                    POST /pause
                  </span>
                </button>

                {/* Resume */}
                <button
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('resume');
                  }}
                  disabled={submitting || event.status !== 'PAUSED'}
                  className="p-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <RotateCcw className="w-5 h-5 text-cyan-400" />
                  <div className="font-bold">RESUME</div>
                  <span className="text-[9px] bg-cyan-900/90 text-cyan-200 px-1 py-0.5 rounded">
                    POST /resume
                  </span>
                </button>

                {/* Complete */}
                <button
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('complete');
                  }}
                  disabled={submitting || event.status === 'COMPLETED'}
                  className="p-3 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <Square className="w-5 h-5 text-indigo-400" />
                  <div className="font-bold">COMPLETE</div>
                  <span className="text-[9px] bg-indigo-900/90 text-indigo-200 px-1 py-0.5 rounded">
                    POST /complete
                  </span>
                </button>

                {/* Cancel */}
                <button
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('cancel');
                  }}
                  disabled={submitting || event.status === 'CANCELLED'}
                  className="p-3 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div className="font-bold">CANCEL</div>
                  <span className="text-[9px] bg-red-900/90 text-red-200 px-1 py-0.5 rounded">
                    POST /cancel
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!selectedAction}
        onClose={() => {
          setSelectedAction(null);
          setEventConfirmName('');
        }}
        title={`CONFIRM EVENT TRANSITION: ${selectedAction?.toUpperCase()}`}
        requiredEndpoint={`/admin/events/${event.id}/${selectedAction}`}
        method="POST"
        isDangerous={isDestructive}
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-300">
            Execute transition <strong className="text-amber-400 font-mono">{selectedAction?.toUpperCase()}</strong> for{' '}
            <strong className="text-white">{event.name}</strong>?
          </p>

          {isDestructive && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded space-y-2">
              <label className="block text-red-300 font-semibold">
                To confirm destructive action, type the exact event name below:
              </label>
              <div className="text-[11px] font-mono text-gray-300 bg-slate-900 p-1.5 rounded">
                {event.name}
              </div>
              <input
                type="text"
                value={eventConfirmName}
                onChange={(e) => setEventConfirmName(e.target.value)}
                placeholder="Type exact event name to confirm"
                className="w-full bg-slate-950 border border-slate-700 rounded py-2 px-3 text-gray-100 font-semibold"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyber-border">
            <button
              onClick={() => {
                setSelectedAction(null);
                setEventConfirmName('');
              }}
              disabled={submitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded font-semibold transition"
            >
              CANCEL
            </button>
            <button
              onClick={confirmAction}
              disabled={submitting || (isDestructive && eventConfirmName !== event.name)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded font-bold transition flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>CONFIRM TRANSITION</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="CREATE NEW COMPETITION EVENT"
        requiredEndpoint="/admin/events"
        method="POST"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">EVENT NAME</label>
            <input
              type="text"
              value={newEventDTO.name}
              onChange={(e) => setNewEventDTO({ ...newEventDTO, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">ORGANIZATION</label>
              <input
                type="text"
                value={newEventDTO.organization}
                onChange={(e) => setNewEventDTO({ ...newEventDTO, organization: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">DEPARTMENT</label>
              <input
                type="text"
                value={newEventDTO.department}
                onChange={(e) => setNewEventDTO({ ...newEventDTO, department: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">COLLEGE</label>
              <input
                type="text"
                value={newEventDTO.college}
                onChange={(e) => setNewEventDTO({ ...newEventDTO, college: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
                required
              />
            </div>
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
              <span>SUBMIT EVENT</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
