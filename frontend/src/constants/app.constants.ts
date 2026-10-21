import { Priority, IncidentStatus, SlaState } from '@/types';

export const APP_NAME = 'CloudSec Incident Monitor';
export const POLL_INTERVAL_MS = 5000;
export const PAGE_SIZE = 20;

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  P1: {
    bg: 'var(--color-priority-p1-subtle)',
    text: 'var(--color-priority-p1)',
    border: 'var(--color-priority-p1)',
  },
  P2: {
    bg: 'var(--color-priority-p2-subtle)',
    text: 'var(--color-priority-p2)',
    border: 'var(--color-priority-p2)',
  },
  P3: {
    bg: 'var(--color-priority-p3-subtle)',
    text: 'var(--color-priority-p3)',
    border: 'var(--color-priority-p3)',
  },
  P4: {
    bg: 'var(--color-priority-p4-subtle)',
    text: 'var(--color-priority-p4)',
    border: 'var(--color-priority-p4)',
  },
};

export const STATUS_COLORS: Record<IncidentStatus, { bg: string; text: string }> = {
  OPEN: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
  TRIAGED: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
  IN_PROGRESS: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
  RESOLVED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  CLOSED: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af' },
};

export const SLA_STATE_COLORS: Record<SlaState, { bg: string; text: string }> = {
  ON_TRACK: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
  AT_RISK: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  BREACHED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  RESOLVED_IN_SLA: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
  RESOLVED_LATE: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
};
