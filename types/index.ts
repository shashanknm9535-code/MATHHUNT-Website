export type EventStatus = 'DRAFT' | 'READY' | 'LIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Event {
  id: string;
  name: string;
  organization: string;
  department: string;
  college: string;
  description?: string;
  status: EventStatus;
  startTime?: string | null;
  endTime?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TeamStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DISQUALIFIED' | 'PENDING' | 'SOLVING_MATH' | 'SOLVING_RIDDLE' | 'SCANNING_QR';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  studentId?: string;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  assignedRouteId?: string | null;
  assignedRouteName?: string;
  members: TeamMember[];
  score: number;
  currentStepIndex: number;
  totalSteps: number;
  currentLocationName?: string;
  status: TeamStatus;
  violationsCount: number;
  lastActivityAt: string;
}

export interface GameSession {
  id: string;
  teamId?: string;
  status: string;
  currentRouteStepId?: string;
  challengeStartedAt?: string | null;
  totalScore: number;
  penalties?: number;
  lastPenaltyApplied?: string | null;
  version?: number;
}

export interface Location {
  id: string;
  name: string;
  code?: string;
  building?: string;
  floor?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  qrSecretHash?: string;
  active?: boolean;
  createdAt?: string;
}

export interface LocationQR {
  id: string;
  locationId: string;
  locationName?: string;
  qrCodePayload: string;
  generatedAt: string;
  isExpired?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  question: string;
  /**
   * Authoritative backend data.
   * Admin-only access. MUST NEVER be sent to Android client.
   */
  answer: string;
  type: 'SINGLE_CHOICE' | 'NUMERIC' | 'FORMULA' | 'ALGEBRA' | 'TEXT';
  timeLimitSeconds: number;
  baseScore: number;
  bonusScore: number;
  penalty: number;
  active: boolean;
}

export interface Riddle {
  id: string;
  title: string;
  question: string;
  answer: string;
  destinationLocationId?: string | null;
  destinationLocationName?: string;
  active: boolean;
}

export interface RouteStep {
  id: string;
  routeId: string;
  stepOrder: number;
  locationId: string;
  location?: Location;
  challengeId?: string | null;
  challenge?: Challenge | null;
  riddleId?: string | null;
  riddle?: Riddle | null;
}

export interface Route {
  id: string;
  name: string;
  code?: string;
  description?: string;
  stepsCount: number;
  teamsAssignedCount: number;
  steps: RouteStep[];
}

export type ViolationType =
  | 'APP_BACKGROUND'
  | 'SCREENSHOT'
  | 'SCREEN_CAPTURE'
  | 'MULTI_WINDOW'
  | 'INVALID_QR'
  | 'WRONG_LOCATION'
  | 'SESSION_CONFLICT'
  | 'DUPLICATE_SUBMISSION';

export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Violation {
  id: string;
  teamId: string;
  teamCode: string;
  teamName: string;
  type: ViolationType;
  severity: ViolationSeverity;
  details: string;
  timestamp: string;
  routeStepOrder?: number;
  actionTaken?: string;
}

export interface ViolationSummary {
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  byType?: Record<string, number>;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ScoreEvent {
  id: string;
  teamId: string;
  delta: number;
  reason: string;
  timestamp: string;
}

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: AdminRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendEndpointStatus {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  available: boolean;
  requiredScope: string;
  note: string;
}

/**
 * NestJS Standard Error Response
 */
export interface NestApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Standardized Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Live Monitoring Types (GET /admin/live)
export interface LiveTeamMonitoringItem {
  id: string;
  code: string;
  name: string;
  status: TeamStatus;
  score: number;
  penalties?: number;
  currentStepIndex: number;
  totalSteps: number;
  currentLocationName?: string;
  lastActivityAt: string;
  violationsCount: number;
}

export interface LiveMonitoringData {
  eventId: string;
  eventName: string;
  eventStatus: EventStatus;
  totalTeams: number;
  activeTeamsCount: number;
  pausedTeamsCount: number;
  completedTeamsCount: number;
  disqualifiedTeamsCount: number;
  teams: LiveTeamMonitoringItem[];
  lastUpdated: string;
}

export interface LiveTeamDetail {
  id: string;
  code: string;
  name: string;
  eventId: string;
  gameSession?: {
    id?: string;
    status: string;
    totalScore: number;
    penalties?: number;
    currentRouteStepId?: string;
  };
  members: TeamMember[];
  assignedRoute?: Route;
  violations?: Violation[];
  scoreEvents?: ScoreEvent[];
  _count?: {
    violations: number;
    scoreEvents: number;
  };
}

// Leaderboard Item (GET /admin/leaderboard)
export interface LeaderboardItem {
  rank: number;
  teamId: string;
  teamCode: string;
  teamName: string;
  score: number;
  penalties?: number;
  completedSteps: number;
  totalSteps: number;
  status: TeamStatus;
  lastActivityAt: string;
  completionTimeSeconds?: number;
}

// Reports Data Types
export interface ScoreReportData {
  eventId: string;
  eventName?: string;
  totalTeams: number;
  totalScoreEvents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoreDistribution?: {
    range: string;
    count: number;
  }[];
}

export interface TeamReportData {
  teamId: string;
  teamCode: string;
  teamName: string;
  totalScore: number;
  completedSteps: number;
  totalSteps: number;
  totalViolations: number;
  solveHistory?: {
    stepOrder: number;
    challengeTitle?: string;
    pointsEarned: number;
    timestamp: string;
  }[];
}

export interface EventReportData {
  eventId: string;
  name: string;
  organization: string;
  department: string;
  college: string;
  status: EventStatus;
  startTime?: string | null;
  endTime?: string | null;
  totalTeams: number;
  activeTeams: number;
  completedTeams: number;
  disqualifiedTeams: number;
  totalViolations: number;
  generatedAt: string;
}

// Request DTOs
export interface CreateEventDTO {
  name: string;
  organization: string;
  department: string;
  college: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
}

export interface CreateTeamDTO {
  eventId: string;
  code: string;
  name: string;
  pin: string;
  isActive: boolean;
}

export interface TeamDetailDTO {
  id: string;
  code: string;
  name: string;
  eventId: string;
  event?: {
    name: string;
    status: string;
  };
  gameSession?: {
    status: string;
    totalScore: number;
  };
  members: TeamMember[];
  _count?: {
    violations: number;
    scoreEvents: number;
  };
}

export interface CreateRouteDTO {
  name: string;
  eventId: string;
}

export interface AddRouteStepDTO {
  locationId: string;
  order: number;
}

export interface UpdateRouteStepDTO {
  order?: number;
  challengeId?: string | null;
  riddleId?: string | null;
}

export interface CreateLocationDTO {
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateChallengeDTO {
  title?: string;
  question: string;
  answer: string;
  type?: Challenge['type'];
  timeLimitSeconds?: number;
  baseScore?: number;
  bonusScore?: number;
  penalty?: number;
  active?: boolean;
}

export interface CreateRiddleDTO {
  title?: string;
  question: string;
  answer: string;
  destinationLocationId?: string;
  active?: boolean;
}

export interface ScoreAdjustmentDTO {
  amount: number;
  reason: string;
}

export interface ForceStatusDTO {
  status: TeamStatus;
  reason?: string;
}
