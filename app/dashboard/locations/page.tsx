'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, QrCode, RefreshCw, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { MOCK_LOCATIONS } from '@/lib/mock/mockData';
import { ApiErrorMessage } from '@/components/ui/ApiErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { locationsApi, isMockMode } from '@/lib/api';
import { Location, CreateLocationDTO } from '@/types';

export default function LocationsPage() {
  const mock = isMockMode();
  const [locations, setLocations] = useState<Location[]>(mock ? MOCK_LOCATIONS : []);
  const [loading, setLoading] = useState<boolean>(!mock);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [qrModal, setQrModal] = useState<{ location: Location; rawToken?: string } | null>(null);
  const [confirmText, setConfirmText] = useState<string>('');

  const [newLocDTO, setNewLocDTO] = useState<CreateLocationDTO>({
    name: 'MVJ Central Library',
    description: 'Reference section near Mathematics Journal racks.',
    latitude: 12.9863,
    longitude: 77.7289,
  });

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    const res = await locationsApi.getLocationsList();
    setLoading(false);
    if (res.success && res.data) {
      setLocations(res.data);
      if (res.message) setNotice(res.message);
    } else if (res.error) {
      setError(res.error);
      setStatusCode(res.statusCode);
      setLocations([]);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await locationsApi.createLocation(newLocDTO);
    setSubmitting(false);
    setShowCreateModal(false);

    if (res.success && res.data) {
      setNotice(`Location '${res.data.name}' registered via POST /admin/locations.`);
      fetchLocations();
    } else {
      setError(res.error || 'Failed to register location.');
      setStatusCode(res.statusCode);
    }
  };

  const handleRegenerateQR = async () => {
    if (!qrModal || confirmText !== 'REGENERATE') return;
    setSubmitting(true);
    setError(null);

    const res = await locationsApi.regenerateQR(qrModal.location.id);
    setSubmitting(false);

    if (res.success && res.data) {
      setQrModal({
        location: qrModal.location,
        rawToken: res.data.qrCodePayload,
      });
      setConfirmText('');
      setNotice(`New QR deployment token generated for location '${qrModal.location.name}'. Old physical posters invalidated.`);
    } else {
      setError(res.error || 'QR regeneration failed.');
      setStatusCode(res.statusCode);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="border-b border-cyber-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Locations & Cryptographic QR Management
          </h1>
          <p className="text-gray-400 mt-1">
            Register physical campus checkpoints and manage raw deployment QR tokens for posters.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER LOCATION</span>
        </button>
      </div>

      <ApiErrorMessage error={error} statusCode={statusCode} onRetry={fetchLocations} />

      {notice && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded text-cyan-300 font-mono">
          {notice}
        </div>
      )}

      {/* Location Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-8 gap-3 text-cyan-400 font-mono">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Fetching Checkpoint Locations...</span>
        </div>
      ) : locations.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-lg text-gray-400">
          No registered checkpoint locations found. Click 'REGISTER LOCATION' to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div key={loc.id} className="math-card p-5 space-y-4 border-t-2 border-t-cyan-500 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-cyan-400">{loc.code || loc.id}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                    ACTIVE
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{loc.name}</h3>
                <div className="text-gray-400">{loc.building || 'Campus Wing'} • {loc.floor || 'Floor'}</div>
                <p className="text-gray-400 leading-relaxed text-[11px] pt-1">{loc.description}</p>
              </div>

              <div className="pt-3 border-t border-cyber-border flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setConfirmText('');
                    setQrModal({ location: loc });
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded border border-slate-700 flex items-center gap-1.5 transition font-semibold"
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>VIEW TOKEN</span>
                </button>

                <button
                  onClick={() => {
                    setConfirmText('');
                    setQrModal({ location: loc });
                  }}
                  className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded border border-amber-800 flex items-center gap-1.5 transition font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>REGENERATE</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Preview & Safety Regenerate Modal */}
      <Modal
        isOpen={!!qrModal}
        onClose={() => {
          setQrModal(null);
          setConfirmText('');
        }}
        title={`CRYPTOGRAPHIC QR MANAGEMENT: ${qrModal?.location.name}`}
        requiredEndpoint={`/admin/locations/${qrModal?.location.id}/qr/regenerate`}
        method="POST"
      >
        {qrModal && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col items-center justify-center space-y-3">
              <div className="w-44 h-44 bg-white p-3 rounded-lg flex flex-col items-center justify-center border-4 border-cyan-500 shadow-xl">
                <div className="w-full h-full border-2 border-black flex flex-col items-center justify-center text-center text-black font-bold p-2 space-y-1">
                  <QrCode className="w-14 h-14 text-black" />
                  <div className="text-[11px] leading-tight">{qrModal.location.name}</div>
                  <div className="text-[8px] text-gray-600 font-mono">DEPLOYMENT TOKEN</div>
                </div>
              </div>

              <div className="text-[10px] text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded border border-cyan-800 font-mono break-all text-center">
                TOKEN: {qrModal.rawToken || `MATHHUNT_VERIFY:${qrModal.location.id}:DEPLOYMENT_TOKEN`}
              </div>
            </div>

            {/* Strict Warning Banner */}
            <div className="p-3 bg-red-950/50 border border-red-800 rounded text-red-200 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-300">PHYSICAL POSTER WARNING:</span>
                <p className="mt-0.5">
                  Regenerating this QR invalidates the previously printed physical QR poster for this location. Teams scanning old posters will receive <code className="text-amber-300 font-mono">INVALID_QR</code> security violations.
                </p>
              </div>
            </div>

            {/* Type REGENERATE Safety Input */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <label className="block text-gray-300 font-semibold">
                To confirm regeneration, type <strong className="text-amber-400 font-mono">REGENERATE</strong> below:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type REGENERATE to unlock button"
                className="w-full bg-slate-950 border border-slate-700 rounded py-2 px-3 text-gray-100 font-mono font-bold uppercase tracking-wider"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyber-border">
              <button
                onClick={() => {
                  setQrModal(null);
                  setConfirmText('');
                }}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded font-semibold"
              >
                CLOSE
              </button>

              <button
                onClick={handleRegenerateQR}
                disabled={submitting || confirmText !== 'REGENERATE'}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded font-bold transition flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REGENERATE QR TOKEN</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Register Location Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="REGISTER NEW CAMPUS LOCATION (POST /admin/locations)"
        requiredEndpoint="/admin/locations"
        method="POST"
      >
        <form onSubmit={handleCreateLocation} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">LOCATION NAME</label>
            <input
              type="text"
              value={newLocDTO.name}
              onChange={(e) => setNewLocDTO({ ...newLocDTO, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200 font-semibold"
              placeholder="MVJ Central Library"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 font-semibold">DESCRIPTION & PHYSICAL LANDMARKS</label>
            <textarea
              value={newLocDTO.description}
              onChange={(e) => setNewLocDTO({ ...newLocDTO, description: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
              placeholder="Reference section near Mathematics Journal racks..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-gray-400 mb-1 font-sans font-semibold">LATITUDE</label>
              <input
                type="number"
                step="any"
                value={newLocDTO.latitude}
                onChange={(e) => setNewLocDTO({ ...newLocDTO, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-sans font-semibold">LONGITUDE</label>
              <input
                type="number"
                step="any"
                value={newLocDTO.longitude}
                onChange={(e) => setNewLocDTO({ ...newLocDTO, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded py-2 px-3 text-gray-200"
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
              <span>REGISTER LOCATION</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
