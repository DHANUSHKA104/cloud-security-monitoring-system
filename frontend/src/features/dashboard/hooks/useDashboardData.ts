import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { POLL_INTERVAL_MS } from '@/constants/app.constants';

export const useDashboardData = () => {
  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardService.getSummary,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const trendsQuery = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: dashboardService.getTrends,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const workloadQuery = useQuery({
    queryKey: ['dashboard', 'workload'],
    queryFn: dashboardService.getWorkload,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const atRiskQuery = useQuery({
    queryKey: ['dashboard', 'at-risk'],
    queryFn: dashboardService.getAtRisk,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const insightsQuery = useQuery({
    queryKey: ['dashboard', 'insights'],
    queryFn: dashboardService.getInsights,
    refetchInterval: 30000,
  });

  return {
    summary: summaryQuery.data,
    trends: trendsQuery.data,
    workload: workloadQuery.data,
    atRisk: atRiskQuery.data,
    insights: insightsQuery.data,
    isLoading:
      summaryQuery.isLoading ||
      trendsQuery.isLoading ||
      workloadQuery.isLoading ||
      atRiskQuery.isLoading,
    refetchAll: () => {
      summaryQuery.refetch();
      trendsQuery.refetch();
      workloadQuery.refetch();
      atRiskQuery.refetch();
      insightsQuery.refetch();
    },
  };
};
