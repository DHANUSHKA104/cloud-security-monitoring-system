export type ID = string;
export type ISODateString = string;

export type Role = 'ADMIN' | 'ANALYST' | 'VIEWER';
export type TeamRole = 'MEMBER' | 'LEAD';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'OPEN' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Category =
  | 'AUTH_ATTACK'
  | 'MALWARE'
  | 'DATA_EXPOSURE'
  | 'NETWORK_INTRUSION'
  | 'POLICY_VIOLATION'
  | 'OTHER';

export type SlaState =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'BREACHED'
  | 'RESOLVED_IN_SLA'
  | 'RESOLVED_LATE';

export type EventType =
  | 'CREATED'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'STATUS_CHANGED'
  | 'COMMENT'
  | 'ESCALATED'
  | 'SLA_AT_RISK'
  | 'SLA_BREACHED'
  | 'RESOLVED'
  | 'REOPENED';

export type ThreatLevel = 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
