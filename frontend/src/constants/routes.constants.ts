export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  INCIDENTS: '/incidents',
  INCIDENT_DETAILS: (id: string = ':id') => `/incidents/${id}`,
  ASSETS: '/assets',
  ASSET_DETAILS: (id: string = ':id') => `/assets/${id}`,
  WORKFLOWS: '/workflows',
  USERS: '/users',
  PROFILE: '/profile',
  NOT_FOUND: '*',
} as const;
