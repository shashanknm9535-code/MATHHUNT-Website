/**
 * ============================================================================
 * MATHHUNT ADMIN API SERVICE LAYER
 * ============================================================================
 * Implements real HTTP communication matching the NestJS backend API contract.
 * Uses centralized client (`fetchApi`) with JWT authorization headers and NestJS
 * error handling.
 * ============================================================================
 */

import { fetchApi, ApiResponse, isMockMode, getApiBaseUrl } from './client';
import {
  Event,
  Team,
  Route,
  Location,
  LocationQR,
  Challenge,
  Riddle,
  Violation,
  ViolationSummary,
  AuditLog,
  AdminUser,
  PaginatedResponse,
  LiveMonitoringData,
  LiveTeamDetail,
  LeaderboardItem,
  ScoreReportData,
  TeamReportData,
  EventReportData,
  CreateEventDTO,
  CreateTeamDTO,
  TeamDetailDTO,
  CreateRouteDTO,
  AddRouteStepDTO,
  UpdateRouteStepDTO,
  CreateLocationDTO,
  CreateChallengeDTO,
  CreateRiddleDTO,
  ScoreAdjustmentDTO,
  ForceStatusDTO,
  BackendEndpointStatus,
  TeamStatus,
} from '@/types';
import {
  MOCK_EVENT,
  MOCK_TEAMS,
  MOCK_ROUTES,
  MOCK_LOCATIONS,
  MOCK_CHALLENGES,
  MOCK_RIDDLES,
  MOCK_VIOLATIONS,
  BACKEND_ENDPOINT_COVERAGE,
} from '@/lib/mock/mockData';

export { fetchApi, isMockMode, getApiBaseUrl };
export type { ApiResponse };

/**
 * Authentication Service
 */
export const authApi = {
  async login(username: string, password: string): Promise<ApiResponse<{ access_token: string; user: AdminUser }>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          access_token: 'mock_jwt_token_demo_mode',
          user: { id: 'admin-01', username, role: 'SUPER_ADMIN' },
        },
      };
    }
    return fetchApi<{ access_token: string; user: AdminUser }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async getMe(): Promise<ApiResponse<AdminUser>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: { id: 'admin-01', username: 'mathlite_master', role: 'SUPER_ADMIN' },
      };
    }
    return fetchApi<AdminUser>('/admin/auth/me', {
      method: 'GET',
    });
  },
};

/**
 * Event Control Service
 */
export const eventApi = {
  async listEvents(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Event>>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          items: [MOCK_EVENT],
          total: 1,
          page,
          limit,
          totalPages: 1,
        },
      };
    }
    const res = await fetchApi<any>(`/admin/events?page=${page}&limit=${limit}`, {
      method: 'GET',
    });

    let finalRes = res;
    if (!res.success && res.statusCode === 500) {
      const fallbackRes = await fetchApi<any>('/admin/events', { method: 'GET' });
      if (fallbackRes.success) {
        finalRes = fallbackRes;
      }
    }

    if (!finalRes.success) {
      return {
        success: false,
        statusCode: finalRes.statusCode,
        error: finalRes.error || 'GET /admin/events endpoint error.',
        isMockData: false,
      };
    }

    const items: Event[] = Array.isArray(finalRes.data)
      ? finalRes.data
      : (Array.isArray(finalRes.data?.items) ? finalRes.data.items : []);

    const total = finalRes.data?.total ?? items.length;
    const totalPages = finalRes.data?.totalPages ?? (Math.ceil(total / limit) || 1);

    return {
      success: true,
      statusCode: finalRes.statusCode,
      isMockData: false,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  async createEvent(dto: CreateEventDTO): Promise<ApiResponse<Event>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: { ...MOCK_EVENT, name: dto.name },
      };
    }
    return fetchApi<Event>('/admin/events', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async transitionStatus(
    eventId: string,
    action: 'ready' | 'start' | 'pause' | 'resume' | 'complete' | 'cancel'
  ): Promise<ApiResponse<Event>> {
    if (isMockMode()) {
      const statusMap: Record<string, Event['status']> = {
        ready: 'READY',
        start: 'LIVE',
        pause: 'PAUSED',
        resume: 'LIVE',
        complete: 'COMPLETED',
        cancel: 'CANCELLED',
      };
      return {
        success: true,
        isMockData: true,
        data: { ...MOCK_EVENT, status: statusMap[action] || 'LIVE' },
      };
    }
    return fetchApi<Event>(`/admin/events/${eventId}/${action}`, {
      method: 'POST',
    });
  },
};

/**
 * Teams Management Service
 */
export const teamsApi = {
  async createTeam(dto: CreateTeamDTO): Promise<ApiResponse<Team>> {
    if (isMockMode()) {
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        code: dto.code,
        name: dto.name,
        isActive: dto.isActive,
        members: [],
        score: 0,
        currentStepIndex: 1,
        totalSteps: 7,
        status: 'ACTIVE',
        violationsCount: 0,
        lastActivityAt: new Date().toISOString(),
      };
      return {
        success: true,
        isMockData: true,
        data: newTeam,
      };
    }
    return fetchApi<Team>('/admin/teams', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getTeamById(id: string): Promise<ApiResponse<TeamDetailDTO>> {
    if (isMockMode()) {
      const mockTeam = MOCK_TEAMS.find((t) => t.id === id) || MOCK_TEAMS[0];
      return {
        success: true,
        isMockData: true,
        data: {
          id: mockTeam.id,
          code: mockTeam.code,
          name: mockTeam.name,
          eventId: MOCK_EVENT.id,
          event: { name: MOCK_EVENT.name, status: MOCK_EVENT.status },
          gameSession: { status: mockTeam.status, totalScore: mockTeam.score },
          members: mockTeam.members,
          _count: { violations: mockTeam.violationsCount, scoreEvents: 3 },
        },
      };
    }
    return fetchApi<TeamDetailDTO>(`/admin/teams/${id}`, {
      method: 'GET',
    });
  },

  async getTeamsList(): Promise<ApiResponse<Team[]>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: MOCK_TEAMS,
      };
    }
    const res = await fetchApi<any>('/admin/teams', { method: 'GET' });
    if (!res.success) {
      return {
        success: false,
        isMockData: false,
        statusCode: res.statusCode,
        error: res.error || 'GET /admin/teams list endpoint unavailable on backend.',
        endpointRequired: 'GET /admin/teams',
      };
    }
    const items: Team[] = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data?.items) ? res.data.items : []);

    return {
      success: true,
      statusCode: res.statusCode,
      isMockData: false,
      data: items,
    };
  },
};

/**
 * Live Monitoring Service (GET /admin/live)
 */
export const liveApi = {
  async getLiveMonitoring(eventId?: string): Promise<ApiResponse<LiveMonitoringData>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          eventId: eventId || MOCK_EVENT.id,
          eventName: MOCK_EVENT.name,
          eventStatus: MOCK_EVENT.status,
          totalTeams: MOCK_TEAMS.length,
          activeTeamsCount: MOCK_TEAMS.filter((t) => t.status === 'ACTIVE' || t.status === 'SOLVING_MATH').length,
          pausedTeamsCount: MOCK_TEAMS.filter((t) => t.status === 'PAUSED').length,
          completedTeamsCount: MOCK_TEAMS.filter((t) => t.status === 'COMPLETED').length,
          disqualifiedTeamsCount: MOCK_TEAMS.filter((t) => t.status === 'DISQUALIFIED').length,
          teams: MOCK_TEAMS.map((t) => ({
            id: t.id,
            code: t.code,
            name: t.name,
            status: t.status,
            score: t.score,
            currentStepIndex: t.currentStepIndex,
            totalSteps: t.totalSteps,
            currentLocationName: t.currentLocationName,
            lastActivityAt: t.lastActivityAt,
            violationsCount: t.violationsCount,
          })),
          lastUpdated: new Date().toISOString(),
        },
      };
    }
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
    return fetchApi<LiveMonitoringData>(`/admin/live${query}`, { method: 'GET' });
  },

  async getLiveTeamDetail(teamId: string): Promise<ApiResponse<LiveTeamDetail>> {
    if (isMockMode()) {
      const mockTeam = MOCK_TEAMS.find((t) => t.id === teamId) || MOCK_TEAMS[0];
      return {
        success: true,
        isMockData: true,
        data: {
          id: mockTeam.id,
          code: mockTeam.code,
          name: mockTeam.name,
          eventId: MOCK_EVENT.id,
          gameSession: {
            status: mockTeam.status,
            totalScore: mockTeam.score,
          },
          members: mockTeam.members,
          violations: MOCK_VIOLATIONS.filter((v) => v.teamId === mockTeam.id),
          _count: {
            violations: mockTeam.violationsCount,
            scoreEvents: 5,
          },
        },
      };
    }
    return fetchApi<LiveTeamDetail>(`/admin/live/teams/${teamId}`, { method: 'GET' });
  },
};

/**
 * Authoritative Leaderboard Service (GET /admin/leaderboard)
 */
export const leaderboardApi = {
  async getLeaderboard(eventId?: string): Promise<ApiResponse<LeaderboardItem[]>> {
    if (isMockMode()) {
      const sorted = [...MOCK_TEAMS]
        .sort((a, b) => b.score - a.score)
        .map((t, idx) => ({
          rank: idx + 1,
          teamId: t.id,
          teamCode: t.code,
          teamName: t.name,
          score: t.score,
          completedSteps: t.currentStepIndex,
          totalSteps: t.totalSteps,
          status: t.status,
          lastActivityAt: t.lastActivityAt,
        }));
      return {
        success: true,
        isMockData: true,
        data: sorted,
      };
    }
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
    const res = await fetchApi<any>(`/admin/leaderboard${query}`, { method: 'GET' });
    if (!res.success) return res;

    const items: LeaderboardItem[] = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data?.items) ? res.data.items : []);

    return {
      success: true,
      statusCode: res.statusCode,
      isMockData: false,
      data: items,
    };
  },
};

/**
 * Anti-Cheat & Violations Service (GET /admin/violations)
 */
export const violationsApi = {
  async getViolations(
    page = 1,
    limit = 20,
    eventId?: string,
    teamId?: string,
    type?: string
  ): Promise<ApiResponse<PaginatedResponse<Violation>>> {
    if (isMockMode()) {
      let filtered = [...MOCK_VIOLATIONS];
      if (type && type !== 'ALL') {
        filtered = filtered.filter((v) => v.type === type);
      }
      return {
        success: true,
        isMockData: true,
        data: {
          items: filtered,
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit) || 1,
        },
      };
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (eventId) params.append('eventId', eventId);
    if (teamId) params.append('teamId', teamId);
    if (type && type !== 'ALL') params.append('type', type);

    const res = await fetchApi<any>(`/admin/violations?${params.toString()}`, { method: 'GET' });
    if (!res.success) return res;

    const items: Violation[] = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data?.items) ? res.data.items : []);

    const total = res.data?.total ?? items.length;
    const totalPages = res.data?.totalPages ?? (Math.ceil(total / limit) || 1);

    return {
      success: true,
      statusCode: res.statusCode,
      isMockData: false,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  async getSummary(): Promise<ApiResponse<ViolationSummary>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          totalViolations: MOCK_VIOLATIONS.length,
          criticalCount: MOCK_VIOLATIONS.filter((v) => v.severity === 'CRITICAL').length,
          highCount: MOCK_VIOLATIONS.filter((v) => v.severity === 'HIGH').length,
          mediumCount: MOCK_VIOLATIONS.filter((v) => v.severity === 'MEDIUM').length,
          lowCount: MOCK_VIOLATIONS.filter((v) => v.severity === 'LOW').length,
        },
      };
    }
    return fetchApi<ViolationSummary>('/admin/violations/summary', { method: 'GET' });
  },
};

/**
 * Audit Log Service (GET /admin/audit)
 */
export const auditApi = {
  async getAuditLogs(
    page = 1,
    limit = 50,
    action?: string,
    adminId?: string
  ): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    if (isMockMode()) {
      const mockLogs: AuditLog[] = [
        {
          id: 'audit-01',
          adminId: 'admin-01',
          adminUsername: 'mathlite_master',
          action: 'EVENT_START',
          targetType: 'Event',
          targetId: MOCK_EVENT.id,
          details: 'Event lifecycle transitioned to LIVE',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'audit-02',
          adminId: 'admin-01',
          adminUsername: 'mathlite_master',
          action: 'SCORE_ADJUSTMENT',
          targetType: 'Team',
          targetId: MOCK_TEAMS[0].id,
          details: 'Adjusted score by +15 pts (Judge Correction)',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
      ];
      return {
        success: true,
        isMockData: true,
        data: {
          items: mockLogs,
          total: mockLogs.length,
          page,
          limit,
          totalPages: 1,
        },
      };
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) params.append('action', action);
    if (adminId) params.append('adminId', adminId);

    return fetchApi<PaginatedResponse<AuditLog>>(`/admin/audit?${params.toString()}`, { method: 'GET' });
  },
};

/**
 * Reports & Analytics Service (GET /admin/reports/*)
 */
export const reportsApi = {
  async getScoreReport(eventId?: string): Promise<ApiResponse<ScoreReportData>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          eventId: eventId || MOCK_EVENT.id,
          eventName: MOCK_EVENT.name,
          totalTeams: MOCK_TEAMS.length,
          totalScoreEvents: 42,
          averageScore: 480,
          highestScore: 780,
          lowestScore: 120,
        },
      };
    }
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
    return fetchApi<ScoreReportData>(`/admin/reports/score${query}`, { method: 'GET' });
  },

  async getEventReport(eventId: string): Promise<ApiResponse<EventReportData>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          eventId,
          name: MOCK_EVENT.name,
          organization: MOCK_EVENT.organization,
          department: MOCK_EVENT.department,
          college: MOCK_EVENT.college,
          status: MOCK_EVENT.status,
          totalTeams: MOCK_TEAMS.length,
          activeTeams: 4,
          completedTeams: 1,
          disqualifiedTeams: 1,
          totalViolations: MOCK_VIOLATIONS.length,
          generatedAt: new Date().toISOString(),
        },
      };
    }
    return fetchApi<EventReportData>(`/admin/reports/events/${eventId}`, { method: 'GET' });
  },

  async getTeamReport(teamId: string): Promise<ApiResponse<TeamReportData>> {
    if (isMockMode()) {
      const mockTeam = MOCK_TEAMS.find((t) => t.id === teamId) || MOCK_TEAMS[0];
      return {
        success: true,
        isMockData: true,
        data: {
          teamId,
          teamCode: mockTeam.code,
          teamName: mockTeam.name,
          totalScore: mockTeam.score,
          completedSteps: mockTeam.currentStepIndex,
          totalSteps: mockTeam.totalSteps,
          totalViolations: mockTeam.violationsCount,
        },
      };
    }
    return fetchApi<TeamReportData>(`/admin/reports/teams/${teamId}`, { method: 'GET' });
  },
};

/**
 * SUPER_ADMIN Operations Service (POST /admin/operations/*)
 */
export const operationsApi = {
  async adjustScore(teamId: string, amount: number, reason: string): Promise<ApiResponse<any>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: { teamId, amount, reason, updatedScore: 500 },
        message: `[DEMO MODE] Score adjusted by ${amount} pts for reason: ${reason}`,
      };
    }
    const dto: ScoreAdjustmentDTO = { amount, reason };
    return fetchApi<any>(`/admin/operations/teams/${teamId}/score-adjustment`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async forceStatus(teamId: string, status: TeamStatus, reason?: string): Promise<ApiResponse<any>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: { teamId, status, reason },
        message: `[DEMO MODE] Team status forced to ${status}`,
      };
    }
    const dto: ForceStatusDTO = { status, reason };
    return fetchApi<any>(`/admin/operations/teams/${teamId}/force-status`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};

/**
 * Routes & Progression Service
 */
export const routesApi = {
  async createRoute(dto: CreateRouteDTO): Promise<ApiResponse<Route>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          id: `route-${Date.now()}`,
          name: dto.name,
          stepsCount: 0,
          teamsAssignedCount: 0,
          steps: [],
        },
      };
    }
    return fetchApi<Route>('/admin/routes', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async addRouteStep(routeId: string, dto: AddRouteStepDTO): Promise<ApiResponse<any>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: { id: `step-${Date.now()}`, routeId, ...dto },
      };
    }
    return fetchApi<any>(`/admin/routes/${routeId}/steps`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateRouteStep(
    routeId: string,
    stepId: string,
    dto: UpdateRouteStepDTO
  ): Promise<ApiResponse<any>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: { id: stepId, routeId, ...dto },
      };
    }
    return fetchApi<any>(`/admin/routes/${routeId}/steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async assignRouteToTeam(teamId: string, routeId: string): Promise<ApiResponse<any>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: { teamId, routeId, assigned: true },
      };
    }
    return fetchApi<any>(`/admin/routes/teams/${teamId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ routeId }),
    });
  },

  async getRoutesList(): Promise<ApiResponse<Route[]>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: MOCK_ROUTES,
      };
    }
    const res = await fetchApi<any>('/admin/routes', { method: 'GET' });
    if (!res.success) {
      return {
        success: false,
        isMockData: false,
        statusCode: res.statusCode,
        error: res.error || 'GET /admin/routes list endpoint unavailable on backend.',
        endpointRequired: 'GET /admin/routes',
      };
    }
    const items: Route[] = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data?.items) ? res.data.items : []);

    return {
      success: true,
      statusCode: res.statusCode,
      isMockData: false,
      data: items,
    };
  },
};

/**
 * Locations & Cryptographic QR Service
 */
export const locationsApi = {
  async createLocation(dto: CreateLocationDTO): Promise<ApiResponse<Location>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          id: `loc-${Date.now()}`,
          name: dto.name,
          description: dto.description,
          latitude: dto.latitude,
          longitude: dto.longitude,
          active: true,
        },
      };
    }
    return fetchApi<Location>('/admin/locations', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async regenerateQR(locationId: string): Promise<ApiResponse<LocationQR>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          id: `qr-${Date.now()}`,
          locationId,
          qrCodePayload: `MATHHUNT_DEPLOYMENT_TOKEN:${locationId}:${Date.now()}`,
          generatedAt: new Date().toISOString(),
          isExpired: false,
        },
      };
    }
    return fetchApi<LocationQR>(`/admin/locations/${locationId}/qr/regenerate`, {
      method: 'POST',
    });
  },

  async getLocationsList(): Promise<ApiResponse<Location[]>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: MOCK_LOCATIONS,
      };
    }
    const res = await fetchApi<any>('/admin/locations', { method: 'GET' });
    if (!res.success) {
      return {
        success: false,
        isMockData: false,
        statusCode: res.statusCode,
        error: res.error || 'GET /admin/locations list endpoint unavailable on backend.',
        endpointRequired: 'GET /admin/locations',
      };
    }
    const items: Location[] = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data?.items) ? res.data.items : []);

    return {
      success: true,
      statusCode: res.statusCode,
      isMockData: false,
      data: items,
    };
  },
};

/**
 * Challenges Service
 */
export const challengesApi = {
  async createChallenge(dto: CreateChallengeDTO): Promise<ApiResponse<Challenge>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          id: `chal-${Date.now()}`,
          title: dto.title || 'Challenge Title',
          question: dto.question,
          answer: dto.answer,
          type: dto.type || 'NUMERIC',
          timeLimitSeconds: dto.timeLimitSeconds || 300,
          baseScore: dto.baseScore || 100,
          bonusScore: dto.bonusScore || 50,
          penalty: dto.penalty || 20,
          active: dto.active !== false,
        },
      };
    }
    return fetchApi<Challenge>('/admin/challenges', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getChallengeById(id: string): Promise<ApiResponse<Challenge>> {
    if (isMockMode()) {
      const chal = MOCK_CHALLENGES.find((c) => c.id === id) || MOCK_CHALLENGES[0];
      return {
        success: true,
        isMockData: true,
        data: chal,
      };
    }
    return fetchApi<Challenge>(`/admin/challenges/${id}`, {
      method: 'GET',
    });
  },

  async getChallengesList(): Promise<ApiResponse<Challenge[]>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: MOCK_CHALLENGES,
      };
    }
    const res = await fetchApi<any>('/admin/challenges', { method: 'GET' });
    if (!res.success) {
      return {
        success: false,
        isMockData: false,
        statusCode: res.statusCode,
        error: res.error || 'GET /admin/challenges list endpoint unavailable on backend.',
        endpointRequired: 'GET /admin/challenges',
      };
    }
    const items: Challenge[] = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data?.items) ? res.data.items : []);

    return {
      success: true,
      statusCode: res.statusCode,
      isMockData: false,
      data: items,
    };
  },
};

/**
 * Riddles Service
 */
export const riddlesApi = {
  async createRiddle(dto: CreateRiddleDTO): Promise<ApiResponse<Riddle>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: {
          id: `rid-${Date.now()}`,
          title: dto.title || 'Riddle Title',
          question: dto.question,
          answer: dto.answer,
          destinationLocationId: dto.destinationLocationId,
          active: dto.active !== false,
        },
      };
    }
    return fetchApi<Riddle>('/admin/riddles', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getRiddleById(id: string): Promise<ApiResponse<Riddle>> {
    if (isMockMode()) {
      const rid = MOCK_RIDDLES.find((r) => r.id === id) || MOCK_RIDDLES[0];
      return {
        success: true,
        isMockData: true,
        data: rid,
      };
    }
    return fetchApi<Riddle>(`/admin/riddles/${id}`, {
      method: 'GET',
    });
  },

  async getRiddlesList(): Promise<ApiResponse<Riddle[]>> {
    if (isMockMode()) {
      return {
        success: true,
        isMockData: true,
        data: MOCK_RIDDLES,
      };
    }
    const res = await fetchApi<any>('/admin/riddles', { method: 'GET' });
    if (!res.success) {
      return {
        success: false,
        isMockData: false,
        statusCode: res.statusCode,
        error: res.error || 'GET /admin/riddles list endpoint unavailable on backend.',
        endpointRequired: 'GET /admin/riddles',
      };
    }
    const items: Riddle[] = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data?.items) ? res.data.items : []);

    return {
      success: true,
      statusCode: res.statusCode,
      isMockData: false,
      data: items,
    };
  },
};

/**
 * System Diagnostics & Backend Status Service
 */
export const diagnosticsApi = {
  async getBackendCoverage(): Promise<BackendEndpointStatus[]> {
    return BACKEND_ENDPOINT_COVERAGE;
  },
};
