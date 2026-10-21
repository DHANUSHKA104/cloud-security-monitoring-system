import React from 'react';

interface SlaComplianceRingProps {
  compliancePct: number;
}

export const SlaComplianceRing: React.FC<SlaComplianceRingProps> = ({
  compliancePct,
}) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compliancePct / 100) * circumference;

  const toneColor =
    compliancePct >= 90
      ? 'text-emerald-500'
      : compliancePct >= 75
      ? 'text-amber-500'
      : 'text-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-18 h-18 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="36"
            cy="36"
            r={radius}
            className="stroke-gray-800"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            className={`${toneColor} transition-all duration-700`}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-xs font-bold font-mono text-gray-100">
          {compliancePct.toFixed(1)}%
        </span>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-300">SLA Met (30d)</div>
        <div className="text-[11px] text-gray-500">Resolution SLA rate</div>
      </div>
    </div>
  );
};
