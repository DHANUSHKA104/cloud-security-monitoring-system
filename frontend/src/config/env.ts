const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  // Fallback to default if undefined in dev
  console.warn('VITE_API_BASE_URL environment variable is not defined, using http://localhost:8080/api');
}

export const ENV = {
  API_BASE_URL: apiBaseUrl || 'http://localhost:8080/api',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
