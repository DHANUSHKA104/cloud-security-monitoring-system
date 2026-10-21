export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    MFA_VERIFY: '/auth/mfa/verify',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    MFA_ENABLE: '/auth/mfa/enable',
    MFA_DISABLE: '/auth/mfa/disable',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  // Users & Teams
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    SKILLS: (id: string) => `/users/${id}/skills`,
  },
  TEAMS: {
    BASE: '/teams',
    BY_ID: (id: string) => `/teams/${id}`,
    MEMBERS: (id: string) => `/teams/${id}/members`,
    MEMBER_BY_USER: (teamId: string, userId: string) => `/teams/${teamId}/members/${userId}`,
  },
  SKILLS: {
    BASE: '/skills',
  },
  SHIFTS: {
    BASE: '/shifts',
    BY_ID: (id: string) => `/shifts/${id}`,
    ON_NOW: '/shifts/on-now',
    HANDOVER: '/shifts/handover',
  },
  // Incidents
  INCIDENTS: {
    BASE: '/incidents',
    BY_ID: (id: string) => `/incidents/${id}`,
    STATUS: (id: string) => `/incidents/${id}/status`,
    ASSIGN: (id: string) => `/incidents/${id}/assign`,
    ESCALATE: (id: string) => `/incidents/${id}/escalate`,
    COMMENTS: (id: string) => `/incidents/${id}/comments`,
    REOPEN: (id: string) => `/incidents/${id}/reopen`,
    TIMELINE: (id: string) => `/incidents/${id}/timeline`,
  },
  SLA_POLICIES: {
    BASE: '/sla-policies',
    BY_PRIORITY: (priority: string) => `/sla-policies/${priority}`,
  },
  // Dashboard
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    TRENDS: '/dashboard/trends',
    WORKLOAD: '/dashboard/workload',
    AT_RISK: '/dashboard/at-risk',
    FEED: '/dashboard/feed',
    INSIGHTS: '/dashboard/insights',
  },
  // Simulation & Demo
  SIM: {
    INCIDENTS: '/sim/incidents',
    SEED: '/sim/seed',
    RESET: '/demo/reset',
  },
} as const;
