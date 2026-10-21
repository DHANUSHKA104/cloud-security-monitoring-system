import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { SlaPolicy } from '@/types/models.types';

export const slaPolicyService = {
  getPolicies: () =>
    apiClient.get<SlaPolicy[]>(API_ENDPOINTS.SLA_POLICIES.BASE),

  updatePolicy: (priority: string, data: Partial<SlaPolicy>) =>
    apiClient.put<SlaPolicy>(API_ENDPOINTS.SLA_POLICIES.BY_PRIORITY(priority), data),
};
