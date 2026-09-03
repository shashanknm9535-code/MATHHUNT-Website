'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardCheck,
  Users,
  CheckCircle2,
  Clock,
  MailWarning,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  RefreshCw,
  Loader2,
  UserCheck,
  Lock,
  QrCode,
  Keyboard,
  X,
  Info,
} from 'lucide-react';
import { useEvent } from '@/lib/auth/EventContext';
import { adminRegistrationApi } from '@/lib/api';
import {
  AdminRegistrationItem,
  ActivationResultResponse,
  RegistrationStats,
} from '@/types';
import { QRScanner } from '@/components/registrations/QRScanner';
import { ActivationModal } from '@/components/registrations/ActivationModal';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: 'REGISTERED' | 'ACTIVATED' }> = ({ status }) => (
  <span
    className={`inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
      status === 'ACTIVATED'
        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
        : 'bg-amber-950/60 text-amber-400 border-amber-700'
    }`}
  >
    {status === 'ACTIVATED' ? (
      <CheckCircle2 className="w-2.5 h-2.5" />
    ) : (
      <Clock className="w-2.5 h-2.5" />
    )}
    <span>{status}</span>
  </span>
);

// ─── Email Status Badge ────────────────────────────────────────────────────────
const EmailBadge: React.FC<{ sent: boolean; label: string; error?: string | null }> = ({
  sent,
  label,
  error,
}) => (
  <span
    className={`inline-flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded border ${
      error
        ? 'bg-red-950/40 text-red-400 border-red-800'
        : sent
        ? 'bg-gray-800 text-gray-300 border-gray-700'
        : 'bg-gray-900 text-gray-500 border-gray-800'
    }`}
  >
    <Mail className="w-2.5 h-2.5" />
    <span>
      {error ? `⚠ ${label} failed` : sent ? `✓ ${label}` : `${label} pending`}
    </span>
  </span>
);

// ─── Registration Details Card ────────────────────────────────────────────────
const RegistrationDetailsCard: React.FC<{
  reg: AdminRegistrationItem;
  selectedEventId: string;
  onActivate: () => void;
  onResend: () => Promise<void>;
  isResending: boolean;
  resendResult: string | null;
}> = ({ reg, selectedEventId, onActivate, onResend, isResending, resendResult }) => {
  const wrongEvent = reg.eventId !== selectedEventId;

  return (
    <div
      className={`rounded-2xl border bg-gray-900/90 shadow-xl overflow-hidden ${
        wrongEvent ? 'border-red-500/50' : 'border-cyan-500/30'
      }`}
    >
      {/* Wrong event banner */}
      {wrongEvent && (
        <div className="flex items-center space-x-2 px-5 py-3 bg-red-950/50 border-b border-red-500/40 text-red-300 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>This registration belongs to a different event. Activation is blocked.</span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Registration Details</p>
            <h3 className="text-lg font-bold text-white">{reg.teamName}</h3>
          </div>
        </div>
        <StatusBadge status={reg.status} />
      </div>

      <div className="p-5 space-y-5">
        {/* Top meta row */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 space-y-1">
            <p className="text-gray-400 uppercase font-semibold tracking-wider text-[10px]">Registration ID</p>
            <p className="font-mono font-bold text-cyan-300">{reg.registrationId}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 space-y-1">
            <p className="text-gray-400 uppercase font-semibold tracking-wider text-[10px]">Event</p>
            <p className="font-bold text-white truncate">{reg.eventName}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 space-y-1">
            <p className="text-gray-400 uppercase font-semibold tracking-wider text-[10px]">College</p>
            <p className="font-semibold text-gray-200 truncate">{reg.college}</p>
          </div>
          {reg.status === 'ACTIVATED' && reg.teamCode && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700 space-y-1">
              <p className="text-emerald-400 uppercase font-semibold tracking-wider text-[10px] flex items-center space-x-1">
                <UserCheck className="w-3 h-3" />
                <span>Official Team ID</span>
              </p>
              <p className="font-black text-emerald-300 font-mono text-base">{reg.teamCode}</p>
            </div>
          )}
        </div>

        {/* Team Leader */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
            <UserCheck className="w-3 h-3 text-cyan-500" />
            <span>Team Leader</span>
          </h4>
          <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div><span className="text-gray-400">Name</span><p className="font-semibold text-white">{reg.leader.name}</p></div>
            <div><span className="text-gray-400">USN / Student ID</span><p className="font-mono text-white">{reg.leader.studentId}</p></div>
            <div><span className="text-gray-400">Email</span><p className="text-cyan-300 font-mono truncate">{reg.leader.email}</p></div>
            <div><span className="text-gray-400">Phone</span><p className="text-gray-200">{reg.leader.phone}</p></div>
            <div><span className="text-gray-400">Year</span><p className="text-gray-200">{reg.leader.year}</p></div>
            <div><span className="text-gray-400">Section</span><p className="text-gray-200">{reg.leader.section}</p></div>
          </div>
        </div>

        {/* Members */}
        {reg.members.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
              <Users className="w-3 h-3 text-cyan-500" />
              <span>Team Members ({reg.members.length})</span>
            </h4>
            <div className="space-y-2">
              {reg.members.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-gray-800/40 border border-gray-700 grid grid-cols-2 gap-x-4 gap-y-1 text-xs"
                >
                  <div className="col-span-2 flex items-center space-x-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center border border-cyan-500/30">
                      {idx + 2}
                    </span>
                    <span className="font-semibold text-white">{m.name}</span>
                  </div>
                  <div><span className="text-gray-400">USN</span><p className="font-mono text-gray-200">{m.studentId}</p></div>
                  <div><span className="text-gray-400">Year / Section</span><p className="text-gray-200">{m.year} · Section {m.section}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Status Row */}
        <div className="flex flex-wrap gap-2">
          <EmailBadge sent={reg.emailStatus.registrationEmailSent} label="Registration Email" />
          {reg.status === 'ACTIVATED' && (
            <EmailBadge
              sent={reg.emailStatus.activationEmailSent ?? false}
              label="Activation Email"
              error={reg.emailStatus.lastError}
            />
          )}
        </div>

        {/* Email failure notice + resend */}
        {reg.status === 'ACTIVATED' && reg.emailStatus.lastError && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/50 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-semibold">
              <MailWarning className="w-4 h-4" />
              <span>Team activation succeeded, but the credential email could not be delivered.</span>
            </div>
            {resendResult && (
              <p className="text-emerald-300 text-[10px]">{resendResult}</p>
            )}
            <button
              type="button"
              onClick={onResend}
              disabled={isResending}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 text-[11px] font-semibold transition-all"
            >
              {isResending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span>Resend Credentials Email</span>
            </button>
          </div>
        )}

        {/* Activation Security Notice */}
        {reg.status === 'ACTIVATED' && (
          <div className="flex items-start space-x-2 text-[11px] text-gray-400 bg-gray-800/30 p-3 rounded-xl border border-gray-800">
            <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
            <span>Team PIN is not displayed for security. It was delivered to the team leader&apos;s email.</span>
          </div>
        )}

        {/* Activate Button */}
        {reg.status === 'REGISTERED' && !wrongEvent && (
          <button
            type="button"
            onClick={onActivate}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm tracking-wider transition-all border border-cyan-400/40 shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ACTIVATE TEAM</span>
          </button>
        )}

        {/* Already Activated Notice */}
        {reg.status === 'ACTIVATED' && (
          <div className="flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-700/50 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>TEAM ALREADY ACTIVATED</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RegistrationsPage() {
  const { selectedEvent, selectedEventId, loadingEvents } = useEvent();

  // Stats
  const [stats, setStats] = useState<RegistrationStats | null>(null);

  // Scanner / Lookup state
  const [scanMode, setScanMode] = useState<'scanner' | 'manual'>('scanner');
  const [manualQuery, setManualQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<AdminRegistrationItem | null>(null);

  // Activation state
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationResult, setActivationResult] = useState<ActivationResultResponse | null>(null);

  // Resend state
  const [isResending, setIsResending] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);

  // Roster state
  const [rosterItems, setRosterItems] = useState<AdminRegistrationItem[]>([]);
  const [rosterTotal, setRosterTotal] = useState(0);
  const [rosterTotalPages, setRosterTotalPages] = useState(1);
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatus, setRosterStatus] = useState('');
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load roster
  const loadRoster = useCallback(
    async (page: number, search: string, status: string) => {
      if (!selectedEventId) return;
      setLoadingRoster(true);
      setRosterError(null);

      const res = await adminRegistrationApi.listRegistrations(selectedEventId, page, 20, search, status);
      setLoadingRoster(false);

      if (res.success && res.data) {
        setRosterItems(res.data.items);
        setRosterTotal(res.data.total);
        setRosterTotalPages(res.data.totalPages);
        setStats(res.data.stats);
      } else {
        setRosterError(res.error || 'Failed to load registrations roster.');
      }
    },
    [selectedEventId]
  );

  useEffect(() => {
    if (selectedEventId) {
      loadRoster(rosterPage, rosterSearch, rosterStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const handleSearchChange = (q: string) => {
    setRosterSearch(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setRosterPage(1);
      loadRoster(1, q, rosterStatus);
    }, 350);
  };

  const handleStatusFilter = (s: string) => {
    setRosterStatus(s);
    setRosterPage(1);
    loadRoster(1, rosterSearch, s);
  };

  const handlePageChange = (p: number) => {
    setRosterPage(p);
    loadRoster(p, rosterSearch, rosterStatus);
  };

  // QR scan handler
  const handleScanResult = useCallback(async (payload: string) => {
    if (!selectedEventId) return;
    setIsLookingUp(true);
    setLookupError(null);
    setSelectedReg(null);
    setActivationResult(null);
    setResendResult(null);

    const res = await adminRegistrationApi.lookupRegistration(payload, selectedEventId);
    setIsLookingUp(false);

    if (res.success && res.data) {
      setSelectedReg(res.data);
    } else {
      setLookupError(res.error || 'Registration not found. Verify QR code or ID and try again.');
    }
  }, [selectedEventId]);

  // Manual lookup
  const handleManualLookup = async () => {
    const q = manualQuery.trim();
    if (!q) return;
    await handleScanResult(q);
  };

  // Activation
  const handleActivateConfirm = async () => {
    if (!selectedReg || !selectedEventId) return;
    setIsActivating(true);
    setActivationError(null);

    const res = await adminRegistrationApi.activateTeam(selectedReg.registrationId, selectedEventId);
    setIsActivating(false);

    if (res.success && res.data) {
      setActivationResult(res.data);
      // Update the selectedReg to reflect new ACTIVATED status
      setSelectedReg((prev) =>
        prev
          ? {
              ...prev,
              status: 'ACTIVATED',
              teamCode: res.data?.teamCode ?? prev.teamCode,
              activatedAt: res.data?.activatedAt ?? null,
              emailStatus: {
                ...prev.emailStatus,
                activationEmailSent: res.data?.emailSent ?? false,
              },
            }
          : prev
      );
      // Refresh roster
      loadRoster(rosterPage, rosterSearch, rosterStatus);
    } else {
      setActivationError(res.error || 'Activation failed. Please try again or contact backend support.');
    }
  };

  // Resend credentials
  const handleResend = async () => {
    if (!selectedReg) return;
    setIsResending(true);
    setResendResult(null);

    const res = await adminRegistrationApi.resendCredentials(selectedReg.registrationId);
    setIsResending(false);

    if (res.success && res.data?.sent) {
      setResendResult('Credentials email successfully resent to the team leader.');
      setSelectedReg((prev) =>
        prev ? { ...prev, emailStatus: { ...prev.emailStatus, activationEmailSent: true, lastError: null } } : prev
      );
    } else {
      setResendResult(res.error || 'Resend attempt failed. Please try again.');
    }
  };

  const clearSelectedReg = () => {
    setSelectedReg(null);
    setLookupError(null);
    setActivationResult(null);
    setResendResult(null);
    setManualQuery('');
  };

  if (loadingEvents) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Registrations</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              CHECK-IN
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Event:{' '}
            <span className="font-semibold text-cyan-300">
              {selectedEvent?.name ?? 'No event selected'}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadRoster(rosterPage, rosterSearch, rosterStatus)}
          className="self-start flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium border border-gray-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* No event selected */}
      {!selectedEventId && (
        <div className="math-card p-8 text-center space-y-2 text-amber-300">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-400" />
          <p className="text-sm font-semibold">No event selected.</p>
          <p className="text-xs text-gray-400">Select an event from the header to use the check-in system.</p>
        </div>
      )}

      {selectedEventId && (
        <>
          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Registered', value: stats.totalRegistered, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
                { label: 'Activated', value: stats.activatedCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                { label: 'Pending Activation', value: stats.pendingCount, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
                { label: 'Email Failures', value: stats.emailFailuresCount, icon: MailWarning, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
              ].map((s) => (
                <div key={s.label} className={`math-card p-4 rounded-xl border ${s.bg} flex items-center space-x-3`}>
                  <s.icon className={`w-7 h-7 flex-shrink-0 ${s.color}`} />
                  <div>
                    <p className="text-xl font-black text-white">{s.value}</p>
                    <p className="text-[10px] text-gray-400 font-semibold leading-tight">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main Content: Scanner + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Scanner Panel */}
            <div className="math-card p-5 rounded-2xl border border-gray-800 space-y-4">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-white">
                  {scanMode === 'scanner' ? (
                    <QrCode className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Keyboard className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>{scanMode === 'scanner' ? 'Scan Registration QR' : 'Enter Registration ID'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScanMode(scanMode === 'scanner' ? 'manual' : 'scanner')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
                >
                  {scanMode === 'scanner' ? 'Manual Entry' : 'Use Camera'}
                </button>
              </div>

              {/* Scanner or Manual Input */}
              {scanMode === 'scanner' ? (
                <QRScanner
                  onScanResult={handleScanResult}
                  isProcessing={isLookingUp}
                  onManualFallback={() => setScanMode('manual')}
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                      placeholder="Enter Registration ID (e.g. REG-2026-123456)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleManualLookup}
                      disabled={isLookingUp || !manualQuery.trim()}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm border border-cyan-400/40 transition-all flex items-center space-x-1.5"
                    >
                      {isLookingUp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>Look Up</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center space-x-1">
                    <Info className="w-3 h-3" />
                    <span>Enter the Registration ID printed on the participant&apos;s QR pass (e.g. REG-2026-XXXXXX).</span>
                  </p>
                </div>
              )}

              {/* Lookup Error */}
              {lookupError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-400">Lookup Failed</p>
                    <p>{lookupError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Registration Details */}
            <div>
              {!selectedReg && !lookupError && (
                <div className="math-card p-10 rounded-2xl border border-gray-800 text-center space-y-3 text-gray-500">
                  <ClipboardCheck className="w-10 h-10 mx-auto text-gray-700" />
                  <p className="text-sm font-medium text-gray-400">
                    Scan or enter a Registration ID to view team details
                  </p>
                </div>
              )}

              {selectedReg && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={clearSelectedReg}
                    className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <RegistrationDetailsCard
                    reg={selectedReg}
                    selectedEventId={selectedEventId}
                    onActivate={() => {
                      setActivationError(null);
                      setActivationResult(null);
                      setShowActivationModal(true);
                    }}
                    onResend={handleResend}
                    isResending={isResending}
                    resendResult={resendResult}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Registrations Roster Table */}
          <div className="math-card rounded-2xl border border-gray-800 overflow-hidden">
            {/* Roster Header */}
            <div className="px-5 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>All Registrations</span>
                {rosterTotal > 0 && (
                  <span className="text-[10px] text-gray-400 font-normal">({rosterTotal} total)</span>
                )}
              </h3>
              <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search team or ID..."
                    className="pl-8 pr-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-44"
                  />
                </div>
                {/* Status Filter */}
                <select
                  value={rosterStatus}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Statuses</option>
                  <option value="REGISTERED">Registered</option>
                  <option value="ACTIVATED">Activated</option>
                </select>
              </div>
            </div>

            {/* Loading roster */}
            {loadingRoster && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
              </div>
            )}

            {/* Roster error */}
            {rosterError && !loadingRoster && (
              <div className="p-6 text-center text-xs text-amber-300 space-y-2">
                <AlertTriangle className="w-6 h-6 mx-auto text-amber-400" />
                <p className="font-semibold">Unable to load registrations list</p>
                <p className="text-gray-400">{rosterError}</p>
              </div>
            )}

            {/* Roster Table */}
            {!loadingRoster && !rosterError && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-950/60">
                        {['Team', 'Reg ID', 'Leader', 'Size', 'Status', 'Email'].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {rosterItems.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center text-gray-500 py-10">
                            No registrations found.
                          </td>
                        </tr>
                      )}
                      {rosterItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-800/40 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedReg(item);
                            setLookupError(null);
                            setActivationResult(null);
                            setResendResult(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                            {item.teamName}
                            {item.teamCode && (
                              <span className="ml-1.5 text-[10px] font-mono text-cyan-400">{item.teamCode}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-cyan-300 whitespace-nowrap">{item.registrationId}</td>
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                            <div>{item.leader.name}</div>
                            <div className="text-gray-500 text-[10px]">{item.leader.email}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-center">
                            {item.members.length + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3">
                            {item.emailStatus.lastError ? (
                              <span className="text-red-400 text-[10px]">⚠ Failed</span>
                            ) : item.emailStatus.activationEmailSent ? (
                              <span className="text-emerald-400 text-[10px]">✓ Sent</span>
                            ) : (
                              <span className="text-gray-500 text-[10px]">Reg only</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[10px] text-cyan-400 font-medium underline">View</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {rosterTotalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800">
                    <p className="text-[11px] text-gray-400">
                      Page {rosterPage} of {rosterTotalPages} ({rosterTotal} registrations)
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={rosterPage <= 1}
                        onClick={() => handlePageChange(rosterPage - 1)}
                        className="p-1.5 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={rosterPage >= rosterTotalPages}
                        onClick={() => handlePageChange(rosterPage + 1)}
                        className="p-1.5 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Activation Modal */}
      {showActivationModal && selectedReg && (
        <ActivationModal
          registration={selectedReg}
          onConfirm={handleActivateConfirm}
          onCancel={() => {
            if (!isActivating) setShowActivationModal(false);
          }}
          activationResult={activationResult}
          isActivating={isActivating}
          activationError={activationError}
        />
      )}
    </div>
  );
}
