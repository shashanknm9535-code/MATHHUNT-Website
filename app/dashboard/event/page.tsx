'use client';

import React, { useState, useEffect } from 'react';
import { PlaySquare, Play, Pause, Square, RotateCcw, AlertTriangle, CheckCircle, Plus, Loader2, Edit3 } from 'lucide-react';
import { EventStatusBadge } from '@/components/ui/Badge';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { eventApi } from '@/lib/api';
import { CreateEventDTO, UpdateEventDTO, EventStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { useEvent } from '@/lib/auth/EventContext';

export default function EventControlPage() {
  const { events, selectedEvent, selectedEventId, setSelectedEventId, refreshEvents, loadingEvents } = useEvent();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [selectedAction, setSelectedAction] = useState<'ready' | 'start' | 'pause' | 'resume' | 'complete' | 'cancel' | null>(null);
  const [eventConfirmName, setEventConfirmName] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // New Event Form State
  const [newEventDTO, setNewEventDTO] = useState<CreateEventDTO>({
    name: 'MATHHUNT 2026 Grand Championship',
    organization: 'MATHLITE CLUB',
    department: 'MATHEMATICS DEPARTMENT',
    college: 'MVJ COLLEGE OF ENGINEERING',
    description: 'Annual flagship competitive mathematics treasure hunt.',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 14400000).toISOString().slice(0, 16),
    status: 'DRAFT',
  });

  // Edit Event Form State
  const [editEventDTO, setEditEventDTO] = useState<UpdateEventDTO>({});

  // Synchronize edit form when selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      setEditEventDTO({
        name: selectedEvent.name,
        organization: selectedEvent.organization,
        department: selectedEvent.department,
        college: selectedEvent.college,
        description: selectedEvent.description || '',
        startTime: selectedEvent.startTime ? new Date(selectedEvent.startTime).toISOString().slice(0, 16) : '',
        endTime: selectedEvent.endTime ? new Date(selectedEvent.endTime).toISOString().slice(0, 16) : '',
      });
    }
  }, [selectedEvent]);

  const isDestructive = selectedAction === 'cancel' || selectedAction === 'complete';

  // Confirm Status Transition
  const confirmAction = async () => {
    if (!selectedAction || !selectedEvent?.id) return;
    if (isDestructive && eventConfirmName !== selectedEvent.name) return;

    setSubmitting(true);
    setError(null);
    setActionNotice(null);

    const res = await eventApi.transitionStatus(selectedEvent.id, selectedAction);
    setSubmitting(false);
    setSelectedAction(null);
    setEventConfirmName('');

    if (res.success && res.data) {
      setActionNotice(`Event status transitioned to '${selectedAction.toUpperCase()}' successfully.`);
      await refreshEvents();
    } else {
      setError(res.error || `Transition to ${selectedAction} failed.`);
      setStatusCode(res.statusCode);
    }
  };

  // Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: CreateEventDTO = {
      ...newEventDTO,
      startTime: new Date(newEventDTO.startTime).toISOString(),
      endTime: new Date(newEventDTO.endTime).toISOString(),
    };

    const res = await eventApi.createEvent(payload);
    setSubmitting(false);

    if (res.success && res.data) {
      setShowCreateModal(false);
      setActionNotice(`Created new event '${res.data.name}' successfully.`);
      await refreshEvents();
      if (res.data.id) {
        setSelectedEventId(res.data.id);
      }
    } else {
      setError(res.error || 'Failed to create event.');
      setStatusCode(res.statusCode);
    }
  };

  // Edit Event
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent?.id) return;

    setSubmitting(true);
    setError(null);

    const payload: UpdateEventDTO = {
      ...editEventDTO,
      ...(editEventDTO.startTime ? { startTime: new Date(editEventDTO.startTime).toISOString() } : {}),
      ...(editEventDTO.endTime ? { endTime: new Date(editEventDTO.endTime).toISOString() } : {}),
    };

    const res = await eventApi.updateEvent(selectedEvent.id, payload);
    setSubmitting(false);

    if (res.success && res.data) {
      setShowEditModal(false);
      setActionNotice(`Event details for '${res.data.name}' updated successfully.`);
      await refreshEvents();
    } else {
      setError(res.error || 'Failed to update event details.');
      setStatusCode(res.statusCode);
    }
  };

  // Helper to determine allowed status transitions matching NestJS backend state machine
  const isActionAllowed = (target: 'ready' | 'start' | 'pause' | 'resume' | 'complete' | 'cancel'): boolean => {
    if (!selectedEvent) return false;
    const current = selectedEvent.status;

    const map: Record<EventStatus, string[]> = {
      DRAFT: ['ready', 'cancel'],
      READY: ['start', 'draft', 'cancel'],
      LIVE: ['pause', 'complete', 'cancel'],
      PAUSED: ['resume', 'cancel'],
      COMPLETED: [],
      CANCELLED: ['draft'],
    };

    return (map[current] || []).includes(target);
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
            Master control panel for creating, configuring, transitioning, or monitoring competition events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-gray-200 font-mono">
              <span className="text-gray-400">SELECT EVENT:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id} className="bg-slate-900 text-gray-200">
                    {ev.name} ({ev.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE NEW EVENT</span>
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} statusCode={statusCode} onRetry={refreshEvents} />

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
        {loadingEvents ? (
          <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>FETCHING AUTHORITATIVE EVENT STATE FROM NESTJS...</span>
          </div>
        ) : !selectedEvent ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 text-gray-400 font-mono space-y-3">
            <div className="text-gray-300 font-bold">No competition event selected or available.</div>
            <p className="text-xs text-gray-400">Select an event from the top header or initialize a new competition event.</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-2 mx-auto transition"
            >
              <Plus className="w-4 h-4" />
              <span>REGISTER NEW EVENT NOW</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border pb-4">
              <div className="space-y-1">
                <div className="text-gray-400 uppercase text-[10px] tracking-wider font-mono flex items-center gap-2">
                  <span>ACTIVE COMPETITION EVENT</span>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-sans underline"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Details</span>
                  </button>
                </div>
                <h2 className="text-xl font-extrabold text-white">{selectedEvent.name}</h2>
                <div className="text-cyan-400">
                  {selectedEvent.organization} • {selectedEvent.department} • {selectedEvent.college}
                </div>
                {selectedEvent.description && (
                  <p className="text-gray-300 text-xs mt-1">{selectedEvent.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="text-gray-400">CURRENT STATUS:</span>
                <EventStatusBadge status={selectedEvent.status} />
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">EVENT ID:</span>
                <span className="font-bold text-gray-200 font-mono break-all">{selectedEvent.id}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">SCHEDULED START TIME:</span>
                <span className="font-bold text-gray-200 font-mono">{formatDate(selectedEvent.startTime)}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-mono text-[10px]">SCHEDULED END TIME:</span>
                <span className="font-bold text-gray-200 font-mono">{formatDate(selectedEvent.endTime)}</span>
              </div>
            </div>

            {/* Control Action Buttons */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-gray-300 uppercase tracking-wider font-mono">
                AUTHORITATIVE LIFECYCLE TRANSITION ACTIONS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 font-mono">
                {/* Ready */}
                <button
                  type="button"
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('ready');
                  }}
                  disabled={submitting || !isActionAllowed('ready')}
                  className="p-3 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  <div className="font-bold">SET READY</div>
                  <span className="text-[9px] bg-blue-900/90 text-blue-200 px-1 py-0.5 rounded">
                    POST /ready
                  </span>
                </button>

                {/* Start */}
                <button
                  type="button"
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('start');
                  }}
                  disabled={submitting || !isActionAllowed('start')}
                  className="p-3 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <Play className="w-5 h-5 text-emerald-400" />
                  <div className="font-bold">START LIVE</div>
                  <span className="text-[9px] bg-emerald-900/90 text-emerald-200 px-1 py-0.5 rounded">
                    POST /start
                  </span>
                </button>

                {/* Pause */}
                <button
                  type="button"
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('pause');
                  }}
                  disabled={submitting || !isActionAllowed('pause')}
                  className="p-3 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <Pause className="w-5 h-5 text-amber-400" />
                  <div className="font-bold">PAUSE EVENT</div>
                  <span className="text-[9px] bg-amber-900/90 text-amber-200 px-1 py-0.5 rounded">
                    POST /pause
                  </span>
                </button>

                {/* Resume */}
                <button
                  type="button"
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('resume');
                  }}
                  disabled={submitting || !isActionAllowed('resume')}
                  className="p-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <RotateCcw className="w-5 h-5 text-cyan-400" />
                  <div className="font-bold">RESUME</div>
                  <span className="text-[9px] bg-cyan-900/90 text-cyan-200 px-1 py-0.5 rounded">
                    POST /resume
                  </span>
                </button>

                {/* Complete */}
                <button
                  type="button"
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('complete');
                  }}
                  disabled={submitting || !isActionAllowed('complete')}
                  className="p-3 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
                >
                  <Square className="w-5 h-5 text-indigo-400" />
                  <div className="font-bold">COMPLETE</div>
                  <span className="text-[9px] bg-indigo-900/90 text-indigo-200 px-1 py-0.5 rounded">
                    POST /complete
                  </span>
                </button>

                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => {
                    setEventConfirmName('');
                    setSelectedAction('cancel');
                  }}
                  disabled={submitting || !isActionAllowed('cancel')}
                  className="p-3 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex flex-col items-center text-center space-y-1.5"
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
        requiredEndpoint={`/admin/events/${selectedEvent?.id || ''}/${selectedAction}`}
        method="POST"
        isDangerous={isDestructive}
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-300">
            Execute transition <strong className="text-amber-400 font-mono">{selectedAction?.toUpperCase()}</strong> for{' '}
            <strong className="text-white">{selectedEvent?.name || 'Event'}</strong>?
          </p>

          {isDestructive && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded space-y-2">
              <label className="block text-red-300 font-semibold">
                To confirm destructive action, type the exact event name below:
              </label>
              <div className="text-[11px] font-mono text-gray-300 bg-slate-900 p-1.5 rounded">
                {selectedEvent?.name}
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
              type="button"
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
              type="button"
              onClick={confirmAction}
              disabled={submitting || (isDestructive && eventConfirmName !== (selectedEvent?.name || ''))}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded font-bold transition flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>CONFIRM TRANSITION</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`EDIT EVENT DETAILS (${selectedEvent.name})`}
          requiredEndpoint={`/admin/events/${selectedEvent.id}`}
          method="PATCH"
        >
          <form onSubmit={handleEditEvent} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">EVENT NAME</label>
              <input
                type="text"
                value={editEventDTO.name || ''}
                onChange={(e) => setEditEventDTO({ ...editEventDTO, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">ORGANIZATION</label>
                <input
                  type="text"
                  value={editEventDTO.organization || ''}
                  onChange={(e) => setEditEventDTO({ ...editEventDTO, organization: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">DEPARTMENT</label>
                <input
                  type="text"
                  value={editEventDTO.department || ''}
                  onChange={(e) => setEditEventDTO({ ...editEventDTO, department: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">COLLEGE</label>
                <input
                  type="text"
                  value={editEventDTO.college || ''}
                  onChange={(e) => setEditEventDTO({ ...editEventDTO, college: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">DESCRIPTION</label>
              <textarea
                value={editEventDTO.description || ''}
                onChange={(e) => setEditEventDTO({ ...editEventDTO, description: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">START TIME</label>
                <input
                  type="datetime-local"
                  value={editEventDTO.startTime || ''}
                  onChange={(e) => setEditEventDTO({ ...editEventDTO, startTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">END TIME</label>
                <input
                  type="datetime-local"
                  value={editEventDTO.endTime || ''}
                  onChange={(e) => setEditEventDTO({ ...editEventDTO, endTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyber-border">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

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

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">DESCRIPTION</label>
            <textarea
              value={newEventDTO.description || ''}
              onChange={(e) => setNewEventDTO({ ...newEventDTO, description: e.target.value })}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">START TIME</label>
              <input
                type="datetime-local"
                value={newEventDTO.startTime}
                onChange={(e) => setNewEventDTO({ ...newEventDTO, startTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">END TIME</label>
              <input
                type="datetime-local"
                value={newEventDTO.endTime}
                onChange={(e) => setNewEventDTO({ ...newEventDTO, endTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono"
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
              <span>CREATE EVENT</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
