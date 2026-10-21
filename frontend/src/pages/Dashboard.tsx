import React from 'react';
import {
  DashboardHeader,
  OverviewSection,
  AnalyticsSection,
  AlertsSection,
  useDashboardData,
  useRealTimeUpdates,
} from '@/features/dashboard';

export const Dashboard: React.FC = () => {
  const { summary, trends, workload, atRisk, insights, isLoading, refetchAll } =
    useDashboardData();
  const { data: feed } = useRealTimeUpdates(30);

  return (
    <div className="space-y-6">
      <DashboardHeader
        threatLevel={summary?.threatLevel}
        onRefresh={refetchAll}
        loading={isLoading}
      />
      <OverviewSection summary={summary} />
      <AnalyticsSection trends={trends} workload={workload} insights={insights} />
      <AlertsSection atRisk={atRisk} feed={feed} />
    </div>
  );
};
export default Dashboard;
