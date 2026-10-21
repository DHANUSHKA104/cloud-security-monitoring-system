import {
  ID,
  ISODateString,
  Role,
  TeamRole,
  Priority,
  IncidentStatus,
  Category,
  SlaState,
  EventType,
  ThreatLevel,
} from './common.types';

export * from './common.types';
export * from './api.types';

export interface User {
  id: ID;
  email: string;
  fullName: string;
  department?: string;
  role: Role;
  active: boolean;
  mfaEnabled: boolean;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface Skill {
  id: ID;
  name: string;
}

export interface UserSkill {
  skillId: ID;
  skillName: string;
  level: number; // 1 to 3
}

export interface Team {
  id: ID;
  name: string;
  description?: string;
  leadId?: ID;
  leadName?: string;
}

export interface TeamMember {
  userId: ID;
  teamId: ID;
  fullName: string;
  email: string;
  teamRole: TeamRole;
}

export interface Shift {
  id: ID;
  userId: ID;
  userFullName?: string;
  startsAt: ISODateString;
  endsAt: ISODateString;
  createdBy?: ID;
}

export interface CandidateScore {
  userId: ID;
  fullName: string;
  skill: number; // 0 to 40
  workload: number; // 0 to 30
  history: number; // 0 to 20
  runway: number; // 0 to 10
  total: number; // 0 to 100
}

export interface AssignmentExplanation {
  winner: ID;
  noCoverage: boolean;
  candidates: CandidateScore[];
}

export interface Incident {
  id: ID;
  code: string;
  title: string;
  description: string;
  priority: Priority;
  status: IncidentStatus;
  category: Category;
  teamId?: ID;
  teamName?: string;
  assignee?: {
    id: ID;
    fullName: string;
  } | null;
  createdAt: ISODateString;
  acknowledgedAt?: ISODateString | null;
  resolvedAt?: ISODateString | null;
  slaDueAt: ISODateString;
  slaState: SlaState;
  timeRemainingSeconds: number;
  escalationLevel: number; // 0, 1, 2
  escalatedTo?: {
    id: ID;
    fullName: string;
  } | null;
  assignmentExplanation?: AssignmentExplanation;
}

export interface IncidentEvent {
  id: ID;
  incidentId: ID;
  type: EventType;
  actorId?: ID | null;
  actorName?: string | null;
  payload?: Record<string, unknown>;
  createdAt: ISODateString;
}

export interface SlaPolicy {
  priority: Priority;
  resolveMinutes: number;
  firstEscalationPct: number;
  secondEscalationPct: number;
}

export interface DashboardSummary {
  openIncidents: number;
  p1Open: number;
  threatScore: number;
  threatLevel: ThreatLevel;
  slaCompliancePct: number;
  mttrMinutes: number;
  atRiskCount: number;
  breachedCount: number;
}

export interface TrendDataPoint {
  timestamp: ISODateString;
  count: number;
}

export interface PriorityBreakdown {
  P1: number;
  P2: number;
  P3: number;
  P4: number;
}

export interface DashboardTrends {
  daily: TrendDataPoint[];
  hourly: TrendDataPoint[];
  byPriority: PriorityBreakdown;
}

export interface AnalystWorkload {
  userId: ID;
  fullName: string;
  openCount: number;
  weightedLoad: number;
  byPriority: PriorityBreakdown;
}

export interface VolumeAnomaly {
  windowStart: ISODateString;
  count: number;
  baseline: number;
  zScore: number;
}

export interface CoverageGap {
  dayOfWeek: string;
  hour: number;
  expectedLoad: number;
  analystsScheduled: number;
}

export interface ResolutionStat {
  category: Category;
  priority: Priority;
  medianMinutes: number;
  p90Minutes: number;
  samples: number;
}

export interface Insights {
  available: boolean;
  volumeAnomalies: VolumeAnomaly[];
  coverageGaps: CoverageGap[];
  resolutionStats: ResolutionStat[];
}
