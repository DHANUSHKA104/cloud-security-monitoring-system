import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { User, PageResponse, Team, Skill, Shift } from '@/types';

export const userService = {
  getUsers: (params?: { page?: number; size?: number; q?: string; role?: string; active?: boolean }) =>
    apiClient.get<PageResponse<User>>(API_ENDPOINTS.USERS.BASE, { params }),

  getUserById: (id: string) =>
    apiClient.get<User>(API_ENDPOINTS.USERS.BY_ID(id)),

  createUser: (data: Partial<User>) =>
    apiClient.post<User>(API_ENDPOINTS.USERS.BASE, data),

  updateUser: (id: string, data: Partial<User>) =>
    apiClient.patch<User>(API_ENDPOINTS.USERS.BY_ID(id), data),

  updateSkills: (id: string, skills: Array<{ skillId: string; level: number }>) =>
    apiClient.put<void>(API_ENDPOINTS.USERS.SKILLS(id), skills),

  getTeams: () => apiClient.get<Team[]>(API_ENDPOINTS.TEAMS.BASE),

  getSkills: () => apiClient.get<Skill[]>(API_ENDPOINTS.SKILLS.BASE),

  getShifts: (params?: { userId?: string; from?: string; to?: string }) =>
    apiClient.get<Shift[]>(API_ENDPOINTS.SHIFTS.BASE, { params }),

  getOnNowShifts: (teamId?: string) =>
    apiClient.get<Shift[]>(API_ENDPOINTS.SHIFTS.ON_NOW, { params: { teamId } }),
};
