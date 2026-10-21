import React from 'react';
import { DashboardTrends, AnalystWorkload, Insights } from '@/types/models.types';
import { ActivityChart } from '../../components/ActivityChart';

interface AnalyticsSectionProps {
  trends?: DashboardTrends;
  workload?: AnalystWorkload[];
  insights?: Insights;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  trends,
  workload = [],
  insights,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Trends chart */}
      <div className="lg:col-span-2">
        <ActivityChart trends={trends} />
      </div>

      {/* Analyst workload */}
      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 shadow-sm flex flex-col">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">Analyst Active Workload</h3>
        <p className="text-[11px] text-gray-400 mb-4">Weighted load across on-shift responders</p>

        <div className="flex-1 space-y-3 overflow-y-auto max-h-56 pr-1">
          {workload.length === 0 ? (
            <div className="text-xs text-gray-500 py-4 text-center">
              No active analyst assignments recorded
            </div>
          ) : (
            workload.map((w) => (
              <div key={w.userId} className="p-2.5 rounded bg-gray-950 border border-gray-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-200">{w.fullName}</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    Load: {w.weightedLoad.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                  <span className="text-red-400 font-mono">P1: {w.byPriority?.P1 ?? 0}</span>
                  <span className="text-orange-400 font-mono">P2: {w.byPriority?.P2 ?? 0}</span>
                  <span className="text-amber-400 font-mono">P3: {w.byPriority?.P3 ?? 0}</span>
                  <span className="text-blue-400 font-mono">P4: {w.byPriority?.P4 ?? 0}</span>
                  <span className="ml-auto text-gray-400">Total: {w.openCount}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Insights Panel (Shown when available) */}
      {insights?.available && (
        <div className="lg:col-span-3 p-4 rounded-lg bg-gray-900 border border-blue-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <h3 className="text-sm font-semibold text-gray-200">
                Statistical Intelligence & Anomaly Insights
              </h3>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">FastAPI Analytics Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Volume Anomalies */}
            <div className="p-3 rounded bg-gray-950 border border-gray-800">
              <div className="text-xs font-medium text-amber-400 mb-1">
                Volume Anomalies (Z-Score &gt; 2.0)
              </div>
              {insights.volumeAnomalies.length === 0 ? (
                <p className="text-[11px] text-gray-500">No volume spikes exceeding baseline</p>
              ) : (
                <div className="space-y-1">
                  {insights.volumeAnomalies.map((va, idx) => (
                    <div key={idx} className="text-[11px] text-gray-300 flex justify-between">
                      <span>Window: {va.windowStart}</span>
                      <span className="font-mono text-red-400 font-semibold">
                        {va.count} events (z={va.zScore.toFixed(1)})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coverage Gaps */}
            <div className="p-3 rounded bg-gray-950 border border-gray-800">
              <div className="text-xs font-medium text-blue-400 mb-1">
                Upcoming Shift Coverage Gaps
              </div>
              {insights.coverageGaps.length === 0 ? (
                <p className="text-[11px] text-gray-500">All upcoming shifts adequately staffed</p>
              ) : (
                <div className="space-y-1">
                  {insights.coverageGaps.map((cg, idx) => (
                    <div key={idx} className="text-[11px] text-gray-300 flex justify-between">
                      <span>{cg.dayOfWeek} at {cg.hour}:00</span>
                      <span className="font-mono text-amber-400">
                        Scheduled: {cg.analystsScheduled} (Est Load: {cg.expectedLoad.toFixed(1)})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
