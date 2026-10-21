import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import {
  DashboardSummary,
  DashboardTrends,
  AnalystWorkload,
  Incident,
  IncidentEvent,
  Insights,
} from '@/types/models.types';

export const dashboardService = {
  getSummary: () =>
    apiClient.get<DashboardSummary>(API_ENDPOINTS.DASHBOARD.SUMMARY),

  getTrends: () =>
    apiClient.get<DashboardTrends>(API_ENDPOINTS.DASHBOARD.TRENDS),

  getWorkload: () =>
    apiClient.get<AnalystWorkload[]>(API_ENDPOINTS.DASHBOARD.WORKLOAD),

  getAtRisk: () =>
    apiClient.get<Incident[]>(API_ENDPOINTS.DASHBOARD.AT_RISK),

  getFeed: (limit = 30) =>
    apiClient.get<IncidentEvent[]>(`${API_ENDPOINTS.DASHBOARD.FEED}?limit=${limit}`),

  getInsights: () =>
    apiClient.get<Insights>(API_ENDPOINTS.DASHBOARD.INSIGHTS),
};
