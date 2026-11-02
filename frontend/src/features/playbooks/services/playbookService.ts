import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import {
  Playbook,
  IncidentPlaybookStatus,
  ExecutePlaybookStepPayload,
} from '../types/playbook.types';

export const playbookService = {
  getAllPlaybooks: () =>
    apiClient.get<Playbook[]>(API_ENDPOINTS.PLAYBOOKS.BASE),

  getPlaybookByCategory: (category: string) =>
    apiClient.get<Playbook>(API_ENDPOINTS.PLAYBOOKS.BY_CATEGORY(category)),

  getIncidentPlaybook: (incidentId: string) =>
    apiClient.get<IncidentPlaybookStatus>(API_ENDPOINTS.PLAYBOOKS.INCIDENT_PLAYBOOK(incidentId)),

  executeStep: (
    incidentId: string,
    stepId: string,
    data: ExecutePlaybookStepPayload
  ) =>
    apiClient.post<void>(API_ENDPOINTS.PLAYBOOKS.EXECUTE_STEP(incidentId, stepId), data),
};
