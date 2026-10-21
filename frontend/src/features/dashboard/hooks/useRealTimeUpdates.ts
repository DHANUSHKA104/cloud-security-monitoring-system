import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { POLL_INTERVAL_MS } from '@/constants/app.constants';

export const useRealTimeUpdates = (limit = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'feed', limit],
    queryFn: () => dashboardService.getFeed(limit),
    refetchInterval: POLL_INTERVAL_MS,
  });
};
