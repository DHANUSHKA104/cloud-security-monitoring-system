import React from 'react';
import { Button } from '@/components/ui/Button';

interface DashboardHeaderProps {
  threatLevel?: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  lastUpdated?: Date;
  onRefresh?: () => void;
  loading?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  threatLevel = 'LOW',
  lastUpdated = new Date(),
  onRefresh,
  loading = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Security Operations Console</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Live cloud security incident monitoring, SLA guard and automated routing
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-gray-400">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};
