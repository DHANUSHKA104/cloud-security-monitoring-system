export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  INCIDENTS: '/incidents',
  PLAYBOOKS: '/playbooks',
  INCIDENT_DETAILS: (id: string = ':id') => `/incidents/${id}`,
  USERS: '/users',
  PROFILE: '/profile',
  NOT_FOUND: '*',
} as const;
