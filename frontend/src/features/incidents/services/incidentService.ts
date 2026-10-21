import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import {
  Incident,
  IncidentEvent,
  PageResponse,
  Priority,
  Category,
  IncidentStatus,
} from '@/types';

export interface IncidentFilters {
  status?: IncidentStatus;
  priority?: Priority;
  category?: Category;
  assigneeId?: string;
  teamId?: string;
  slaState?: string;
  escalatedToMe?: boolean;
  q?: string;
  page?: number;
  size?: number;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  teamId?: string;
}

export const incidentService = {
  getIncidents: (filters?: IncidentFilters) =>
    apiClient.get<PageResponse<Incident>>(API_ENDPOINTS.INCIDENTS.BASE, {
      params: filters,
    }),

  getIncidentById: (id: string) =>
    apiClient.get<Incident>(API_ENDPOINTS.INCIDENTS.BY_ID(id)),

  createIncident: (data: CreateIncidentPayload) =>
    apiClient.post<Incident>(API_ENDPOINTS.INCIDENTS.BASE, data),

  changeStatus: (id: string, status: IncidentStatus, note?: string) =>
    apiClient.patch<Incident>(API_ENDPOINTS.INCIDENTS.STATUS(id), { status, note }),

  reassign: (id: string, assigneeId: string, reason: string) =>
    apiClient.post<Incident>(API_ENDPOINTS.INCIDENTS.ASSIGN(id), {
      assigneeId,
      reason,
    }),

  escalate: (id: string, toUserId: string, reason: string) =>
    apiClient.post<Incident>(API_ENDPOINTS.INCIDENTS.ESCALATE(id), {
      toUserId,
      reason,
    }),

  addComment: (id: string, text: string) =>
    apiClient.post<void>(API_ENDPOINTS.INCIDENTS.COMMENTS(id), { text }),

  reopen: (id: string, reason: string) =>
    apiClient.post<Incident>(API_ENDPOINTS.INCIDENTS.REOPEN(id), { reason }),

  getTimeline: (id: string) =>
    apiClient.get<IncidentEvent[]>(API_ENDPOINTS.INCIDENTS.TIMELINE(id)),
};
