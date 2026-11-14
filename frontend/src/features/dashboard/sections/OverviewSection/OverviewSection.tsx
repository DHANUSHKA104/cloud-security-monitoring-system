import React from 'react';
import { DashboardSummary } from '@/types/models.types';
import { StatsCard } from '../../components/StatsCard';
import { ThreatGauge } from '../../modules/Statistics/ThreatGauge';

interface OverviewSectionProps {
  summary?: DashboardSummary;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ summary }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          label="Open Incidents"
          value={summary?.openIncidents ?? 0}
          subtext="Active in triage pipeline"
          tone="info"
        />
        <StatsCard
          label="P1 Critical"
          value={summary?.p1Open ?? 0}
          subtext="Immediate response required"
          tone={summary?.p1Open ? 'danger' : 'default'}
        />
        <StatsCard
          label="SLA Compliance"
          value={`${(summary?.slaCompliancePct ?? 100).toFixed(1)}%`}
          subtext="Last 30-day resolution rate"
          tone={
            (summary?.slaCompliancePct ?? 100) >= 90
              ? 'success'
              : (summary?.slaCompliancePct ?? 100) >= 75
              ? 'warning'
              : 'danger'
          }
        />
        <StatsCard
          label="MTTR (30 Days)"
          value={`${(summary?.mttrMinutes ?? 0).toFixed(0)}m`}
          subtext="Mean time to resolve"
          tone="default"
        />
        <ThreatGauge
          score={summary?.threatScore ?? 0}
          level={summary?.threatLevel ?? 'LOW'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Monitored Assets"
          value={summary?.totalAssets ?? 0}
          subtext={`${summary?.criticalAssets ?? 0} Critical infrastructure`}
          tone="info"
        />
        <StatsCard
          label="Response Playbooks"
          value={summary?.totalPlaybooks ?? 0}
          subtext="Standard Operating Procedures"
          tone="default"
        />
        <StatsCard
          label="Playbook Actions Run"
          value={summary?.executedPlaybookSteps ?? 0}
          subtext="Remediation steps executed"
          tone="success"
        />
        <StatsCard
          label="SLA At Risk"
          value={summary?.atRiskCount ?? 0}
          subtext={`${summary?.breachedCount ?? 0} breached deadline`}
          tone={summary?.atRiskCount ? 'warning' : 'default'}
        />
      </div>
    </div>
  );
};

export default OverviewSection;
