import { create } from 'zustand';

interface UserPreferencesState {
  incidentViewMode: 'board' | 'list';
  defaultTeamFilter: string | null;
  setViewMode: (mode: 'board' | 'list') => void;
  setDefaultTeamFilter: (teamId: string | null) => void;
}

export const useUserStore = create<UserPreferencesState>((set) => ({
  incidentViewMode: 'board',
  defaultTeamFilter: null,
  setViewMode: (mode) => set({ incidentViewMode: mode }),
  setDefaultTeamFilter: (teamId) => set({ defaultTeamFilter: teamId }),
}));
