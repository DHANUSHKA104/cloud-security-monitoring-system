import React, { useState } from 'react';
import { PriorityBadge } from '@/features/incidents/components/PriorityBadge';
import { Priority } from '@/types/common.types';

export const ProcessStages: React.FC = () => {
  const [selectedPriority, setSelectedPriority] = useState<Priority>('P1');
  const [elapsedMinutes, setElapsedMinutes] = useState(5);

  const priorityWindows: Record<Priority, { resolve: number; l1Pct: number; l2Pct: number; defaultMedian: number }> = {
    P1: { resolve: 15, l1Pct: 25, l2Pct: 75, defaultMedian: 8 },
    P2: { resolve: 60, l1Pct: 25, l2Pct: 75, defaultMedian: 30 },
    P3: { resolve: 240, l1Pct: 25, l2Pct: 75, defaultMedian: 120 },
    P4: { resolve: 1440, l1Pct: 25, l2Pct: 75, defaultMedian: 720 },
  };

  const currentConfig = priorityWindows[selectedPriority];
  const l1Time = (currentConfig.resolve * currentConfig.l1Pct) / 100;
  const l2Time = (currentConfig.resolve * currentConfig.l2Pct) / 100;
  const resolveTime = currentConfig.resolve;

  // Determine escalation state based on elapsed minutes
  const remaining = Math.max(0, resolveTime - elapsedMinutes);
  const isBreached = elapsedMinutes >= resolveTime;
  const isL2 = !isBreached && elapsedMinutes >= l2Time;
  const isL1 = !isBreached && !isL2 && elapsedMinutes >= l1Time;
  const isAtRisk = !isBreached && remaining <= currentConfig.defaultMedian;

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">3-Tier Automated Escalation Hierarchy</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Guaranteed response times through deterministic tier escalation and 90-day dynamic median resolution risk monitoring
        </p>
      </div>

      {/* 3 Escalation Stages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 0 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-blue-500/5 rounded-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-900">
              TIER 0
            </span>
            <span className="text-[10px] text-gray-400 font-mono">0% - 25% Elapsed</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-100">Assigned Operator</h3>
            <p className="text-[11px] text-gray-400 mt-1">
              Initial triage & hands-on incident containment by the top-ranked on-duty analyst.
            </p>
          </div>

          <div className="p-3 bg-gray-950 border border-gray-800 rounded text-xs space-y-1.5 text-gray-300">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Target Role:</span>
              <span className="font-mono text-gray-200">ANALYST (On-Shift)</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Assignment:</span>
              <span className="font-mono text-sky-400">100-Point Smart Routing</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Action:</span>
              <span className="text-gray-200">Acknowledge & Contain</span>
            </div>
          </div>
        </div>

        {/* Stage 1 */}
        <div className="bg-gray-900 border border-amber-900/40 rounded-lg p-4 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-amber-500/5 rounded-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-900">
              TIER 1 ESCALATION
            </span>
            <span className="text-[10px] text-amber-400 font-mono">25% - 75% Elapsed</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-100">Squad Lead Intervention</h3>
            <p className="text-[11px] text-gray-400 mt-1">
              Triggered automatically when SLA window elapses by 25% without closure or when dynamic risk triggers.
            </p>
          </div>

          <div className="p-3 bg-gray-950 border border-gray-800 rounded text-xs space-y-1.5 text-gray-300">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Escalate Target:</span>
              <span className="font-mono text-amber-300">Squad Lead (LEAD)</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Dynamic Risk:</span>
              <span className="font-mono text-amber-400">90d Median Resolution</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Audit Trail:</span>
              <span className="text-gray-200">ESCALATED (Level 1)</span>
            </div>
          </div>
        </div>

        {/* Stage 2 */}
        <div className="bg-gray-900 border border-rose-900/40 rounded-lg p-4 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-rose-500/5 rounded-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-900">
              TIER 2 ESCALATION
            </span>
            <span className="text-[10px] text-rose-400 font-mono">&gt; 75% Elapsed</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-100">SOC Administrator Command</h3>
            <p className="text-[11px] text-gray-400 mt-1">
              Critical management intervention before full SLA expiration. Highest tier escalation.
            </p>
          </div>

          <div className="p-3 bg-gray-950 border border-gray-800 rounded text-xs space-y-1.5 text-gray-300">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Escalate Target:</span>
              <span className="font-mono text-rose-300">ADMIN / Commander</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Severity Impact:</span>
              <span className="font-mono text-rose-400">Max Threat Score</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Audit Trail:</span>
              <span className="text-gray-200">ESCALATED (Level 2)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Escalation Simulator Widget */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Interactive SLA & Escalation Ladder Simulator
            </h3>
            <p className="text-[11px] text-gray-400">
              Simulate elapsed time to inspect automated status transitions and escalation triggers
            </p>
          </div>

          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setSelectedPriority(p);
                  setElapsedMinutes(Math.round(priorityWindows[p].resolve * 0.3));
                }}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                  selectedPriority === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Time slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">
              Simulated Elapsed Time: <strong className="text-gray-100 font-mono">{elapsedMinutes} minutes</strong>
            </span>
            <span className="text-gray-400">
              SLA Window: <strong className="text-gray-100 font-mono">{resolveTime} minutes</strong>
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={Math.round(resolveTime * 1.2)}
            value={elapsedMinutes}
            onChange={(e) => setElapsedMinutes(parseInt(e.target.value) || 0)}
            className="w-full accent-blue-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>0m (Created)</span>
            <span>{Math.round(l1Time)}m (L1: 25%)</span>
            <span>{Math.round(l2Time)}m (L2: 75%)</span>
            <span>{resolveTime}m (Breach)</span>
          </div>
        </div>

        {/* Simulation Output Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-950 border border-gray-800 rounded-lg text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-medium">Current Status</span>
            <span
              className={`font-mono font-bold text-sm ${
                isBreached
                  ? 'text-rose-500'
                  : isAtRisk
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {isBreached ? 'BREACHED' : isAtRisk ? 'AT_RISK' : 'ON_TRACK'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-medium">Escalation Tier</span>
            <span className="font-mono font-bold text-sm text-gray-200">
              {isBreached ? 'Breached' : isL2 ? 'Tier 2 (Admin)' : isL1 ? 'Tier 1 (Lead)' : 'Tier 0 (Analyst)'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-medium">Time Remaining</span>
            <span className="font-mono font-bold text-sm text-gray-200">
              {remaining > 0 ? `${remaining}m` : '0m (Expired)'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-medium">Dynamic Risk Flag</span>
            <span className="font-mono font-bold text-sm text-amber-400">
              {isAtRisk && !isBreached ? 'Triggered (< Median)' : 'Normal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProcessStages;
