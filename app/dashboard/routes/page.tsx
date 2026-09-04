'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Route as RouteIcon, MapPin, HelpCircle, Puzzle, Layers, Plus, Loader2 } from 'lucide-react';
import { MOCK_ROUTES, MOCK_LOCATIONS, MOCK_TEAMS, MOCK_EVENT } from '@/lib/mock/mockData';
import { AdminSecretNotice } from '@/components/ui/BackendBanner';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { routesApi, locationsApi, teamsApi, isMockMode } from '@/lib/api';
import { Route, Location, Team, CreateRouteDTO, AddRouteStepDTO } from '@/types';
import { useEvent } from '@/lib/auth/EventContext';

export default function RoutesPage() {
  const mock = isMockMode();
  const { selectedEventId } = useEvent();
  const [routes, setRoutes] = useState<Route[]>(mock ? MOCK_ROUTES : []);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(mock ? MOCK_ROUTES[0] : null);
  const [locations, setLocations] = useState<Location[]>(mock ? MOCK_LOCATIONS : []);
  const [teams, setTeams] = useState<Team[]>(mock ? MOCK_TEAMS : []);
  
  const [loading, setLoading] = useState<boolean>(!mock);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const [showCreateRouteModal, setShowCreateRouteModal] = useState<boolean>(false);
  const [showAddStepModal, setShowAddStepModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);

  const [newRouteDTO, setNewRouteDTO] = useState<CreateRouteDTO>({
    name: 'Delta Matrix Route',
    eventId: selectedEventId || (mock ? MOCK_EVENT.id : ''),
  });

  const [newStepDTO, setNewStepDTO] = useState<AddRouteStepDTO>({
    locationId: '',
    order: 1,
  });

  const [assignTeamId, setAssignTeamId] = useState<string>('');

  useEffect(() => {
    if (selectedEventId) {
      setNewRouteDTO((prev) => ({ ...prev, eventId: selectedEventId }));
    }
  }, [selectedEventId]);

  const fetchRoutesData = useCallback(async () => {
    if (!mock && !selectedEventId) return;
    setLoading(true);
    setError(null);
    const [routesRes, locsRes, teamsRes] = await Promise.all([
      routesApi.getRoutesList(selectedEventId || undefined),
      locationsApi.getLocationsList(selectedEventId || undefined),
      teamsApi.getTeamsList(selectedEventId || undefined),
    ]);

    setLoading(false);

    if (routesRes.success && routesRes.data) {
      const fetchedRoutes = routesRes.data;
      setRoutes(fetchedRoutes);
      setSelectedRoute((prev) => {
        const stillExists = prev && fetchedRoutes.some((r) => r.id === prev.id);
        return stillExists ? prev : (fetchedRoutes.length > 0 ? fetchedRoutes[0] : null);
      });
    } else {
      setRoutes([]);
      setSelectedRoute(null);
    }
    if (locsRes.success && locsRes.data) {
      setLocations(locsRes.data);
      if (locsRes.data.length > 0) {
        setNewStepDTO((prev) => ({ ...prev, locationId: locsRes.data![0].id }));
      }
    }
    if (teamsRes.success && teamsRes.data) {
      setTeams(teamsRes.data);
      if (teamsRes.data.length > 0) {
        setAssignTeamId(teamsRes.data[0].id);
      }
    }
  }, [selectedEventId, mock]);

  useEffect(() => {
    setSelectedRoute(null);
    setRoutes([]);
    fetchRoutesData();
  }, [selectedEventId, fetchRoutesData]);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await routesApi.createRoute(newRouteDTO);
    setSubmitting(false);
    setShowCreateRouteModal(false);

    if (res.success && res.data) {
      setNotice(`Route '${res.data.name}' created via POST /admin/routes.`);
      fetchRoutesData();
    } else {
      setError(res.error || 'Failed to create route.');
      setStatusCode(res.statusCode);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;
    setSubmitting(true);
    setError(null);

    const res = await routesApi.addRouteStep(selectedRoute.id, newStepDTO);
    setSubmitting(false);
    setShowAddStepModal(false);

    if (res.success) {
      setNotice(`Step #${newStepDTO.order} added to route via POST /admin/routes/${selectedRoute.id}/steps.`);
      fetchRoutesData();
    } else {
      setError(res.error || 'Failed to add step.');
      setStatusCode(res.statusCode);
    }
  };

  const handleAssignRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute || !assignTeamId) return;
    setSubmitting(true);
    setError(null);

    const res = await routesApi.assignRouteToTeam(assignTeamId, selectedRoute.id);
    setSubmitting(false);
    setShowAssignModal(false);

    if (res.success) {
      setNotice(`Route '${selectedRoute.name}' assigned to team via POST /admin/routes/teams/${assignTeamId}/assign.`);
      fetchRoutesData();
    } else {
      setError(res.error || 'Failed to assign route.');
      setStatusCode(res.statusCode);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-blue-400" />
            Routes & Progression Steps Management
          </h1>
          <p className="text-gray-400 mt-1">
            Configure checkpoint step sequences and assign routes to participating teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            disabled={!selectedRoute || teams.length === 0}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-gray-200 font-bold rounded-lg border border-slate-700 transition"
          >
            ASSIGN TO TEAM
          </button>

          <button
            onClick={() => setShowCreateRouteModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE ROUTE</span>
          </button>
        </div>
      </div>

      <AdminSecretNotice />

      <ApiErrorMessage error={error} statusCode={statusCode} onRetry={fetchRoutesData} />

      {notice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded text-emerald-300">
          {notice}
        </div>
      )}

      {/* Grid Layout: Route Selector & Step Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route List Column */}
        <div className="math-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-2">
            <h3 className="font-bold text-gray-200 uppercase tracking-wide">AVAILABLE ROUTES</h3>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-mono">
              {routes.length} Routes
            </span>
          </div>

          {loading && routes.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-cyan-400 gap-2 font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading Routes...</span>
            </div>
          ) : routes.length === 0 ? (
            <div className="p-6 text-center text-gray-400 font-mono">
              No routes available. Click 'CREATE ROUTE' to start.
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    selectedRoute?.id === route.id
                      ? 'bg-blue-950/60 border-blue-500/80 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-gray-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 font-mono">{route.code || 'RT-01'}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-gray-400 border border-slate-700 font-mono">
                      {route.stepsCount || route.steps?.length || 0} Steps
                    </span>
                  </div>
                  <div className="font-semibold text-gray-100 mt-1">{route.name}</div>
                  <div className="mt-2 text-[10px] text-emerald-400 flex items-center justify-between font-mono">
                    <span>Assigned Teams: {route.teamsAssignedCount || 0}</span>
                    <span>Select Route →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Route Step Details Column */}
        <div className="lg:col-span-2 math-card p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase font-mono">ROUTE STEP SEQUENCER</div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {selectedRoute?.name || 'Select a Route'}
              </h2>
            </div>
            <button
              onClick={() => setShowAddStepModal(true)}
              disabled={!selectedRoute}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD STEP</span>
            </button>
          </div>

          {!selectedRoute?.steps || selectedRoute.steps.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
              <Layers className="w-8 h-8 text-gray-600 mx-auto" />
              <div className="text-gray-300 font-bold">No Steps Added Yet to {selectedRoute?.name || 'Route'}</div>
              <p className="text-gray-500 font-mono text-[11px]">
                Click 'ADD STEP' to send `POST /admin/routes/${selectedRoute?.id || 'id'}/steps` with location checkpoint IDs.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedRoute.steps.map((step) => (
                <div
                  key={step.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/50 flex items-center justify-center font-bold text-xs font-mono">
                        #{step.stepOrder}
                      </span>
                      <span className="font-bold text-gray-200">CHECKPOINT STAGE #{step.stepOrder}</span>
                    </div>

                    <span className="text-[10px] text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-mono">
                      LOCATION ID: {step.locationId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 space-y-1">
                      <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>LOCATION CHECKPOINT</span>
                      </div>
                      <div className="font-bold text-gray-200">{step.location?.name || 'Checkpoint Location'}</div>
                    </div>

                    <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 space-y-1">
                      <div className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        <span>MATH CHALLENGE</span>
                      </div>
                      <div className="font-bold text-gray-200">{step.challenge?.title || step.challengeId || 'Unattached'}</div>
                    </div>

                    <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 space-y-1">
                      <div className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                        <Puzzle className="w-3 h-3" />
                        <span>DESTINATION RIDDLE</span>
                      </div>
                      <div className="font-bold text-gray-200">{step.riddle?.title || step.riddleId || 'Unattached'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Route Modal */}
      <Modal
        isOpen={showCreateRouteModal}
        onClose={() => setShowCreateRouteModal(false)}
        title="CREATE ROUTE (POST /admin/routes)"
        requiredEndpoint="/admin/routes"
        method="POST"
      >
        <form onSubmit={handleCreateRoute} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">ROUTE NAME</label>
            <input
              type="text"
              value={newRouteDTO.name}
              onChange={(e) => setNewRouteDTO({ ...newRouteDTO, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
              placeholder="Route Alpha"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">EVENT ID</label>
            <input
              type="text"
              value={newRouteDTO.eventId}
              onChange={(e) => setNewRouteDTO({ ...newRouteDTO, eventId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono text-[11px]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyber-border">
            <button
              type="button"
              onClick={() => setShowCreateRouteModal(false)}
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
              <span>CREATE ROUTE</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Step Modal */}
      <Modal
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        title={`ADD STEP TO ROUTE (${selectedRoute?.name})`}
        requiredEndpoint={`/admin/routes/${selectedRoute?.id}/steps`}
        method="POST"
      >
        <form onSubmit={handleAddStep} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">LOCATION CHECKPOINT</label>
            <select
              value={newStepDTO.locationId}
              onChange={(e) => setNewStepDTO({ ...newStepDTO, locationId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">STEP ORDER NUMBER</label>
            <input
              type="number"
              value={newStepDTO.order}
              onChange={(e) => setNewStepDTO({ ...newStepDTO, order: parseInt(e.target.value) || 1 })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-mono"
              min={1}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyber-border">
            <button
              type="button"
              onClick={() => setShowAddStepModal(false)}
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
              <span>ADD STEP</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Route Modal (P0 FIXED: Dynamic real backend teams) */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`ASSIGN ROUTE (${selectedRoute?.name}) TO TEAM`}
        requiredEndpoint={`/admin/routes/teams/:teamId/assign`}
        method="POST"
      >
        <form onSubmit={handleAssignRoute} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">TARGET REGISTERED TEAM</label>
            {teams.length === 0 ? (
              <div className="p-3 bg-slate-900 border border-amber-800 rounded text-amber-300 font-mono text-[11px]">
                No registered teams available on backend. Register a team first.
              </div>
            ) : (
              <select
                value={assignTeamId}
                onChange={(e) => setAssignTeamId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name} ({t.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyber-border">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting || teams.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded font-bold transition flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>ASSIGN ROUTE TO TEAM</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
