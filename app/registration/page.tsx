'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  Building2,
  GraduationCap,
  Calendar,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { registrationApi } from '@/lib/api';
import {
  EventRegistrationConfig,
  RegisterTeamDTO,
  RegistrationResponse,
} from '@/types';
import { RegistrationQR } from '@/components/registration/RegistrationQR';

interface FormLeaderState {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  year: string;
  section: string;
}

interface FormMemberState {
  id: string;
  name: string;
  studentId: string;
  year: string;
  section: string;
}

function RegistrationContent() {
  const searchParams = useSearchParams();
  const eventParam = searchParams.get('event') || undefined;

  // Event & Config States
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [eventConfig, setEventConfig] = useState<EventRegistrationConfig | null>(null);
  const [openEvents, setOpenEvents] = useState<EventRegistrationConfig[]>([]);

  // Form Fields
  const [teamName, setTeamName] = useState<string>('');
  const [teamNameError, setTeamNameError] = useState<string | null>(null);

  // Team Leader State (Member 1)
  const [leader, setLeader] = useState<FormLeaderState>({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    year: '2nd Year',
    section: 'A',
  });
  const [leaderErrors, setLeaderErrors] = useState<Record<string, string>>({});

  // Additional Members State (Member 2, Member 3...)
  const [members, setMembers] = useState<FormMemberState[]>([
    { id: 'm-2', name: '', studentId: '', year: '2nd Year', section: 'A' },
    { id: 'm-3', name: '', studentId: '', year: '2nd Year', section: 'A' },
  ]);
  const [memberErrors, setMemberErrors] = useState<Record<number, Record<string, string>>>({});

  // Confirmations
  const [confirmAccurate, setConfirmAccurate] = useState<boolean>(false);
  const [confirmMembers, setConfirmMembers] = useState<boolean>(false);
  const [confirmRules, setConfirmRules] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<RegistrationResponse | null>(null);

  // Load Event Config
  useEffect(() => {
    async function loadEventData() {
      setLoadingConfig(true);
      setConfigError(null);

      const res = await registrationApi.getEventConfig(eventParam);
      if (res.success && res.data) {
        setEventConfig(res.data);
        const defaultYear = res.data.eligibleYears[0] || '2nd Year';
        const defaultSection =
          res.data.sectionsByYear?.[defaultYear]?.[0] || 'A';

        setLeader((prev) => ({
          ...prev,
          year: defaultYear,
          section: defaultSection,
        }));

        setMembers([
          { id: 'm-2', name: '', studentId: '', year: defaultYear, section: defaultSection },
          { id: 'm-3', name: '', studentId: '', year: defaultYear, section: defaultSection },
        ]);
      } else {
        setConfigError(res.error || 'Failed to load event registration details.');
        // Try fetching open events for fallback picker
        if (!eventParam) {
          const listRes = await registrationApi.listOpenEvents();
          if (listRes.success && listRes.data && listRes.data.length > 0) {
            setOpenEvents(listRes.data);
          }
        }
      }
      setLoadingConfig(false);
    }

    loadEventData();
  }, [eventParam]);

  // Available sections based on selected year
  const getSectionsForYear = (year: string): string[] => {
    if (eventConfig?.sectionsByYear?.[year]) {
      return eventConfig.sectionsByYear[year];
    }
    return ['A', 'B', 'C', 'D'];
  };

  // Add optional team member
  const handleAddMember = () => {
    if (!eventConfig) return;
    const currentTotal = members.length + 1; // including leader
    if (currentTotal < eventConfig.maxTeamSize) {
      const defaultYear = eventConfig.eligibleYears[0] || '2nd Year';
      const defaultSection = getSectionsForYear(defaultYear)[0] || 'A';
      setMembers((prev) => [
        ...prev,
        {
          id: `m-${prev.length + 2}`,
          name: '',
          studentId: '',
          year: defaultYear,
          section: defaultSection,
        },
      ]);
    }
  };

  // Remove optional team member
  const handleRemoveMember = (index: number) => {
    if (!eventConfig) return;
    const currentTotal = members.length + 1;
    if (currentTotal > eventConfig.minTeamSize) {
      setMembers((prev) => prev.filter((_, idx) => idx !== index));
      setMemberErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  // Field change handlers
  const handleLeaderChange = (field: keyof FormLeaderState, value: string) => {
    setLeader((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'year') {
        const availableSections = getSectionsForYear(value);
        if (!availableSections.includes(updated.section)) {
          updated.section = availableSections[0] || 'A';
        }
      }
      return updated;
    });
    setLeaderErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleMemberChange = (index: number, field: keyof FormMemberState, value: string) => {
    setMembers((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };
      if (field === 'year') {
        const availableSections = getSectionsForYear(value);
        if (!availableSections.includes(updated.section)) {
          updated.section = availableSections[0] || 'A';
        }
      }
      next[index] = updated;
      return next;
    });
    setMemberErrors((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: '' },
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    let isValid = true;
    setTeamNameError(null);
    setLeaderErrors({});
    setMemberErrors({});
    setSubmitError(null);

    // 1. Team Name
    const trimmedTeam = teamName.trim();
    if (!trimmedTeam) {
      setTeamNameError('Team name is required.');
      isValid = false;
    } else if (trimmedTeam.length < 3) {
      setTeamNameError('Team name must be at least 3 characters.');
      isValid = false;
    } else if (trimmedTeam.length > 50) {
      setTeamNameError('Team name cannot exceed 50 characters.');
      isValid = false;
    }

    // 2. Leader Validation
    const newLeaderErrors: Record<string, string> = {};
    if (!leader.name.trim()) newLeaderErrors.name = 'Leader full name is required.';
    if (!leader.studentId.trim()) newLeaderErrors.studentId = 'USN / Student ID is required.';
    if (!leader.email.trim()) {
      newLeaderErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leader.email.trim())) {
      newLeaderErrors.email = 'Please enter a valid email address.';
    }
    if (!leader.phone.trim()) {
      newLeaderErrors.phone = 'Phone number is required.';
    } else if (!/^\+?[0-9]{10,14}$/.test(leader.phone.trim().replace(/[\s-]/g, ''))) {
      newLeaderErrors.phone = 'Please enter a valid phone number.';
    }
    if (!leader.year) newLeaderErrors.year = 'Year selection is required.';
    if (!leader.section) newLeaderErrors.section = 'Section selection is required.';

    if (Object.keys(newLeaderErrors).length > 0) {
      setLeaderErrors(newLeaderErrors);
      isValid = false;
    }

    // 3. Members Validation
    const newMemberErrors: Record<number, Record<string, string>> = {};
    members.forEach((m, idx) => {
      const errs: Record<string, string> = {};
      if (!m.name.trim()) errs.name = `Member ${idx + 2} full name is required.`;
      if (!m.studentId.trim()) errs.studentId = `Member ${idx + 2} USN is required.`;
      if (!m.year) errs.year = 'Year is required.';
      if (!m.section) errs.section = 'Section is required.';

      if (Object.keys(errs).length > 0) {
        newMemberErrors[idx] = errs;
        isValid = false;
      }
    });

    if (Object.keys(newMemberErrors).length > 0) {
      setMemberErrors(newMemberErrors);
    }

    // 4. Team Size Check
    const totalTeamSize = members.length + 1;
    if (eventConfig) {
      if (totalTeamSize < eventConfig.minTeamSize) {
        setSubmitError(`Minimum team size for this event is ${eventConfig.minTeamSize} members.`);
        isValid = false;
      } else if (totalTeamSize > eventConfig.maxTeamSize) {
        setSubmitError(`Maximum team size for this event is ${eventConfig.maxTeamSize} members.`);
        isValid = false;
      }
    }

    // 5. Confirmations Check
    if (!confirmAccurate || !confirmMembers || !confirmRules) {
      setSubmitError('You must accept all three required confirmations before registering.');
      isValid = false;
    }

    return isValid;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!eventConfig) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const dto: RegisterTeamDTO = {
      eventId: eventConfig.id,
      teamName: teamName.trim(),
      leaderName: leader.name.trim(),
      leaderEmail: leader.email.trim().toLowerCase(),
      leaderPhone: leader.phone.trim(),
      leaderUsn: leader.studentId.trim().toUpperCase(),
      leaderYear: leader.year,
      leaderSection: leader.section,
      members: members.map((m) => ({
        name: m.name.trim(),
        usn: m.studentId.trim().toUpperCase(),
        year: m.year,
        section: m.section,
      })),
    };

    const res = await registrationApi.registerTeam(dto);

    if (res.success && res.data) {
      setRegistrationSuccess(res.data);
    } else {
      setSubmitError(
        res.error || 'Registration request failed. Please verify team details and try again.'
      );
    }

    setIsSubmitting(false);
  };

  const isFormValidToSubmit =
    confirmAccurate && confirmMembers && confirmRules && !isSubmitting;

  return (
    <main className="min-h-screen bg-[#090d16] bg-math-grid text-gray-100 relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Decorative Equations (Subtle background visual identity) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 text-cyan-400/30 font-mono text-sm select-none">
        <span className="absolute top-24 left-[10%] animate-pulse">{"\\sum_{i=1}^n x_i = \\nabla f(x)"}</span>
        <span className="absolute top-48 right-[12%] animate-pulse">{"\\mathbf{A}x = \\lambda x"}</span>
        <span className="absolute top-96 left-[5%]">{"\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"}</span>
        <span className="absolute bottom-64 right-[8%]">{"e^{i\\pi} + 1 = 0"}</span>
        <span className="absolute bottom-24 left-[15%]">{"\\det(\\mathbf{A} - \\lambda \\mathbf{I}) = 0"}</span>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-[#090d16]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <span className="font-mono font-black text-white text-lg">M</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-white tracking-wider text-base sm:text-lg">
                  MATH<span className="text-cyan-400">HUNT</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full uppercase tracking-widest">
                  Public Team Registration
                </span>
              </div>
              <p className="text-[10px] text-gray-400 tracking-wider">MATHLITE CLUB • MVJCE</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-xs text-gray-300 hover:text-cyan-400 transition-colors font-medium flex items-center space-x-1 bg-gray-900/60 px-3 py-1.5 rounded-lg border border-gray-800"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10 space-y-8">

        {/* Hero Section */}
        <section className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Official Event Portal</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            REGISTER YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">TEAM</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Assemble your team for the MATHHUNT annual mathematical puzzle hunt. Complete all sections accurately to confirm your event participation.
          </p>
        </section>

        {/* Loading State */}
        {loadingConfig && (
          <div className="math-card p-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-gray-300 font-medium">Fetching event configuration from server...</p>
          </div>
        )}

        {/* Configuration Error / Closed Event */}
        {!loadingConfig && (configError || !eventConfig || !eventConfig.isOpen) && (
          <div className="math-card p-8 sm:p-12 text-center space-y-6 border-red-500/30 bg-red-950/20">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {!eventConfig ? 'Event Unavailable' : 'Registration Closed'}
              </h3>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                {configError || 'Registration for this event is currently closed or has not been activated by event control.'}
              </p>
            </div>

            {/* Event Selector if open events exist */}
            {openEvents.length > 0 && (
              <div className="pt-4 border-t border-gray-800 max-w-md mx-auto space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block text-left">
                  Select Available Event
                </label>
                <div className="space-y-2">
                  {openEvents.map((evt) => (
                    <Link
                      key={evt.id}
                      href={`/registration?event=${evt.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-900 border border-cyan-500/30 hover:border-cyan-400 transition-all text-left text-sm"
                    >
                      <div>
                        <p className="font-bold text-white">{evt.name}</p>
                        <p className="text-xs text-gray-400">{evt.college}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success Screen */}
        {!loadingConfig && registrationSuccess && (
          <div className="math-card p-6 sm:p-10 space-y-8 border-emerald-500/40 bg-gray-900/90 shadow-2xl shadow-emerald-500/10">
            {/* Success Hero Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                <span>Pass Issued</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                REGISTRATION <span className="text-emerald-400">SUCCESSFUL</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
                Your team registration has been recorded authoritatively on the MATHHUNT system.
              </p>
            </div>

            {/* QR Voucher Component */}
            <RegistrationQR
              payload={registrationSuccess.qrCodePayload || registrationSuccess.registrationId || registrationSuccess.id || 'MATHHUNT-REG'}
              registrationId={registrationSuccess.registrationId || registrationSuccess.id || 'REG-2026-CONFIRMED'}
              teamName={registrationSuccess.teamName || teamName}
              eventName={registrationSuccess.eventName || eventConfig?.name || 'MATHHUNT 2026'}
            />

            {/* Information Notice */}
            <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700 space-y-2 text-xs text-gray-300">
              <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
                <Info className="w-4 h-4" />
                <span>Important Instructions for Event Day</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-gray-300 pl-1">
                <li>
                  <strong className="text-white">Save this QR code</strong> and bring it printed or digitally on the day of the event.
                </li>
                {registrationSuccess.emailSent !== false ? (
                  <li>
                    A confirmation email has been dispatched to the team leader&apos;s registered email (<span className="text-cyan-300">{leader.email}</span>).
                  </li>
                ) : (
                  <li>
                    Team leaders are advised to keep a screenshot or saved copy of this pass for verification.
                  </li>
                )}
                <li>
                  Your team access PIN and route credentials will be generated and assigned by event controllers during check-in.
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setRegistrationSuccess(null);
                  setTeamName('');
                  setLeader({ name: '', studentId: '', email: '', phone: '', year: '2nd Year', section: 'A' });
                  setMembers([
                    { id: 'm-2', name: '', studentId: '', year: '2nd Year', section: 'A' },
                    { id: 'm-3', name: '', studentId: '', year: '2nd Year', section: 'A' },
                  ]);
                  setConfirmAccurate(false);
                  setConfirmMembers(false);
                  setConfirmRules(false);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold tracking-wider uppercase underline underline-offset-4"
              >
                Register Another Team
              </button>
            </div>
          </div>
        )}

        {/* Main Registration Form */}
        {!loadingConfig && eventConfig && eventConfig.isOpen && !registrationSuccess && (
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. EVENT INFORMATION LOCKED CARD */}
            <div className="math-card p-6 sm:p-8 space-y-5 border-blue-500/30 bg-gray-900/80 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Event Information</h3>
                    <p className="text-xs text-gray-400">Locked by Event Control Configuration</p>
                  </div>
                </div>
                <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  <Lock className="w-3 h-3" />
                  <span>Read-Only</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                    <span>Event</span>
                    <Lock className="w-2.5 h-2.5 text-gray-500" />
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-cyan-300 truncate">{eventConfig.name}</p>
                </div>

                <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    <span>College</span>
                    <Lock className="w-2.5 h-2.5 text-gray-500" />
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{eventConfig.college}</p>
                </div>

                <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                    <GraduationCap className="w-3 h-3 text-gray-400" />
                    <span>Eligibility / Year</span>
                    <Lock className="w-2.5 h-2.5 text-gray-500" />
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    {eventConfig.eligibleYears.join(', ')}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span>Team Size</span>
                    <Lock className="w-2.5 h-2.5 text-gray-500" />
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-emerald-400 truncate">
                    {eventConfig.minTeamSize}–{eventConfig.maxTeamSize} members
                  </p>
                </div>
              </div>
            </div>

            {/* 2. TEAM DETAILS */}
            <div className="math-card p-6 sm:p-8 space-y-5 border-cyan-500/20 bg-gray-900/80">
              <div className="flex items-center space-x-3 border-b border-cyan-500/20 pb-4">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Team Details</h3>
                  <p className="text-xs text-gray-400">Specify your official registered team name</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Team Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    setTeamNameError(null);
                  }}
                  placeholder="e.g. Matrix Masters, Euler Pathfinders"
                  className={`w-full px-4 py-3 rounded-lg bg-gray-950/80 border text-sm text-white placeholder-gray-500 focus:outline-none transition-all ${
                    teamNameError
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                />
                <div className="flex items-center justify-between text-xs mt-1">
                  <p className="text-gray-400 italic">Team name must be unique for this event.</p>
                  {teamNameError && <p className="text-red-400 font-medium">{teamNameError}</p>}
                </div>
              </div>
            </div>

            {/* 3. TEAM LEADER (MEMBER 1) */}
            <div className="math-card p-6 sm:p-8 space-y-5 border-cyan-500/20 bg-gray-900/80">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Team Leader (Member 1)</h3>
                    <p className="text-xs text-gray-400">Primary point of contact & team captain</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded border border-cyan-500/30">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Full Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={leader.name}
                    onChange={(e) => handleLeaderChange('name', e.target.value)}
                    placeholder="Enter leader's full name"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-gray-950/80 border text-sm text-white placeholder-gray-500 focus:outline-none transition-all ${
                      leaderErrors.name ? 'border-red-500' : 'border-gray-800 focus:border-cyan-500'
                    }`}
                  />
                  {leaderErrors.name && <p className="text-xs text-red-400">{leaderErrors.name}</p>}
                </div>

                {/* USN / Student ID */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    USN / Student ID <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={leader.studentId}
                    onChange={(e) => handleLeaderChange('studentId', e.target.value)}
                    placeholder="e.g. 1MJ22CS001"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-gray-950/80 border text-sm text-white uppercase placeholder-gray-500 focus:outline-none transition-all ${
                      leaderErrors.studentId ? 'border-red-500' : 'border-gray-800 focus:border-cyan-500'
                    }`}
                  />
                  {leaderErrors.studentId && <p className="text-xs text-red-400">{leaderErrors.studentId}</p>}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Email Address <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={leader.email}
                    onChange={(e) => handleLeaderChange('email', e.target.value)}
                    placeholder="leader@mvjce.edu.in"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-gray-950/80 border text-sm text-white placeholder-gray-500 focus:outline-none transition-all ${
                      leaderErrors.email ? 'border-red-500' : 'border-gray-800 focus:border-cyan-500'
                    }`}
                  />
                  {leaderErrors.email && <p className="text-xs text-red-400">{leaderErrors.email}</p>}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Phone Number <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={leader.phone}
                    onChange={(e) => handleLeaderChange('phone', e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-gray-950/80 border text-sm text-white placeholder-gray-500 focus:outline-none transition-all ${
                      leaderErrors.phone ? 'border-red-500' : 'border-gray-800 focus:border-cyan-500'
                    }`}
                  />
                  {leaderErrors.phone && <p className="text-xs text-red-400">{leaderErrors.phone}</p>}
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Year <span className="text-cyan-400">*</span>
                  </label>
                  {eventConfig.eligibleYears.length === 1 ? (
                    <div className="w-full px-3.5 py-2.5 rounded-lg bg-gray-950 border border-gray-800 text-sm text-gray-300 flex items-center justify-between">
                      <span>{eventConfig.eligibleYears[0]}</span>
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={leader.year}
                        onChange={(e) => handleLeaderChange('year', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-gray-950/80 border border-gray-800 text-sm text-white appearance-none focus:outline-none focus:border-cyan-500 pr-10"
                      >
                        {eventConfig.eligibleYears.map((yr) => (
                          <option key={yr} value={yr} className="bg-gray-900 text-white">
                            {yr}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  )}
                  {leaderErrors.year && <p className="text-xs text-red-400">{leaderErrors.year}</p>}
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Section <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={leader.section}
                      onChange={(e) => handleLeaderChange('section', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-gray-950/80 border border-gray-800 text-sm text-white appearance-none focus:outline-none focus:border-cyan-500 pr-10"
                    >
                      {getSectionsForYear(leader.year).map((sec) => (
                        <option key={sec} value={sec} className="bg-gray-900 text-white">
                          Section {sec}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  {leaderErrors.section && <p className="text-xs text-red-400">{leaderErrors.section}</p>}
                </div>
              </div>
            </div>

            {/* 4. TEAM MEMBERS */}
            <div className="math-card p-6 sm:p-8 space-y-6 border-cyan-500/20 bg-gray-900/80">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Team Members</h3>
                    <p className="text-xs text-gray-400">
                      Total team size must be between {eventConfig.minTeamSize} and {eventConfig.maxTeamSize} members
                    </p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
                  {members.length + 1} / {eventConfig.maxTeamSize} Members
                </div>
              </div>

              {/* Dynamic Member Cards */}
              <div className="space-y-4">
                {members.map((m, idx) => {
                  const memberNumber = idx + 2;
                  const isRequired = memberNumber <= eventConfig.minTeamSize;
                  const errs = memberErrors[idx] || {};

                  return (
                    <div
                      key={m.id}
                      className="p-4 sm:p-5 rounded-xl bg-gray-950/70 border border-gray-800 space-y-4 relative group hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center border border-cyan-500/30">
                            {memberNumber}
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Member {memberNumber}{' '}
                            {!isRequired && (
                              <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                            )}
                          </h4>
                        </div>

                        {!isRequired && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* Member Full Name */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                            Full Name <span className="text-cyan-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={m.name}
                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                            placeholder="Full Name"
                            className={`w-full px-3 py-2 rounded-lg bg-gray-900 border text-xs text-white placeholder-gray-500 focus:outline-none transition-all ${
                              errs.name ? 'border-red-500' : 'border-gray-700 focus:border-cyan-500'
                            }`}
                          />
                          {errs.name && <p className="text-[10px] text-red-400">{errs.name}</p>}
                        </div>

                        {/* Member USN */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                            USN / Student ID <span className="text-cyan-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={m.studentId}
                            onChange={(e) => handleMemberChange(idx, 'studentId', e.target.value)}
                            placeholder="1MJ22..."
                            className={`w-full px-3 py-2 rounded-lg bg-gray-900 border text-xs text-white uppercase placeholder-gray-500 focus:outline-none transition-all ${
                              errs.studentId ? 'border-red-500' : 'border-gray-700 focus:border-cyan-500'
                            }`}
                          />
                          {errs.studentId && <p className="text-[10px] text-red-400">{errs.studentId}</p>}
                        </div>

                        {/* Member Year */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                            Year <span className="text-cyan-400">*</span>
                          </label>
                          {eventConfig.eligibleYears.length === 1 ? (
                            <div className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-300 flex items-center justify-between">
                              <span>{eventConfig.eligibleYears[0]}</span>
                              <Lock className="w-3 h-3 text-gray-500" />
                            </div>
                          ) : (
                            <div className="relative">
                              <select
                                value={m.year}
                                onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white appearance-none focus:outline-none focus:border-cyan-500 pr-8"
                              >
                                {eventConfig.eligibleYears.map((yr) => (
                                  <option key={yr} value={yr} className="bg-gray-900 text-white">
                                    {yr}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                            </div>
                          )}
                          {errs.year && <p className="text-[10px] text-red-400">{errs.year}</p>}
                        </div>

                        {/* Member Section */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                            Section <span className="text-cyan-400">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={m.section}
                              onChange={(e) => handleMemberChange(idx, 'section', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white appearance-none focus:outline-none focus:border-cyan-500 pr-8"
                            >
                              {getSectionsForYear(m.year).map((sec) => (
                                <option key={sec} value={sec} className="bg-gray-900 text-white">
                                  Section {sec}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                          </div>
                          {errs.section && <p className="text-[10px] text-red-400">{errs.section}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Member CTA */}
              {members.length + 1 < eventConfig.maxTeamSize && (
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-3 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-xl text-cyan-400 hover:text-cyan-300 text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-2 bg-cyan-500/5 hover:bg-cyan-500/10"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Member {members.length + 2}</span>
                </button>
              )}
            </div>

            {/* 5. CONFIRMATION */}
            <div className="math-card p-6 sm:p-8 space-y-4 border-cyan-500/20 bg-gray-900/80">
              <div className="flex items-center space-x-3 border-b border-cyan-500/20 pb-4">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirmation</h3>
                  <p className="text-xs text-gray-400">All three confirmations are required to submit registration</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div
                    onClick={() => setConfirmAccurate(!confirmAccurate)}
                    className="mt-0.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {confirmAccurate ? (
                      <CheckSquare className="w-5 h-5 text-cyan-400 fill-cyan-500/20" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-300 select-none leading-normal">
                    I confirm that all information provided is accurate.
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div
                    onClick={() => setConfirmMembers(!confirmMembers)}
                    className="mt-0.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {confirmMembers ? (
                      <CheckSquare className="w-5 h-5 text-cyan-400 fill-cyan-500/20" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-300 select-none leading-normal">
                    I confirm that all listed members are part of this team.
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div
                    onClick={() => setConfirmRules(!confirmRules)}
                    className="mt-0.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {confirmRules ? (
                      <CheckSquare className="w-5 h-5 text-cyan-400 fill-cyan-500/20" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-300 select-none leading-normal">
                    I agree to follow the MATHHUNT rules and instructions.
                  </span>
                </label>
              </div>
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-start space-x-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-red-400">Registration Error</p>
                  <p>{submitError}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={!isFormValidToSubmit}
                className={`w-full py-4 rounded-xl font-extrabold text-sm sm:text-base tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl ${
                  isFormValidToSubmit
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 border border-cyan-400/40 cursor-pointer active:scale-[0.99]'
                    : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>REGISTERING TEAM...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER TEAM</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {!isFormValidToSubmit && !isSubmitting && (
                <p className="text-[11px] text-center text-gray-400">
                  Fill in all required fields and check all three confirmation boxes to enable registration.
                </p>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 bg-[#060910] py-8 text-center text-xs text-gray-400 space-y-2 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-gray-300 font-semibold">
            <span className="text-cyan-400">MATHHUNT 2026</span>
            <span>•</span>
            <span>MATHLITE CLUB</span>
          </div>
          <p className="text-gray-400">
            Department of Mathematics • MVJ College of Engineering
          </p>
          <p className="text-gray-400 text-[10px]">
            Authoritative Competition Platform
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-cyan-400 font-mono text-sm">
          Loading registration portal...
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}
