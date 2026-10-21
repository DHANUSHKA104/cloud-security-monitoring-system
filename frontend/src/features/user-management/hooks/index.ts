import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';

export const useUsers = (params?: { page?: number; size?: number; q?: string; role?: string; active?: boolean }) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getUsers(params),
  });
};

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: userService.getTeams,
  });
};

export const useSkills = () => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: userService.getSkills,
  });
};

export const useOnNowShifts = (teamId?: string) => {
  return useQuery({
    queryKey: ['shifts', 'on-now', teamId],
    queryFn: () => userService.getOnNowShifts(teamId),
  });
};
