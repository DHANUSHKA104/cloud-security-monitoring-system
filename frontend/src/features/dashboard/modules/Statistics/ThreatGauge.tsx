import React from 'react';
import { ThreatLevel } from '@/types/common.types';

interface ThreatGaugeProps {
  score: number;
  level: ThreatLevel;
}

export const ThreatGauge: React.FC<ThreatGaugeProps> = ({ score, level }) => {
  const levelColors: Record<ThreatLevel, { ring: string; badge: string; text: string }> = {
    LOW: { ring: 'stroke-emerald-500', badge: 'bg-emerald-950 text-emerald-400 border-emerald-800', text: 'text-emerald-400' },
    ELEVATED: { ring: 'stroke-amber-500', badge: 'bg-amber-950 text-amber-400 border-amber-800', text: 'text-amber-400' },
    HIGH: { ring: 'stroke-orange-500', badge: 'bg-orange-950 text-orange-400 border-orange-800', text: 'text-orange-400' },
    CRITICAL: { ring: 'stroke-red-500', badge: 'bg-red-950 text-red-400 border-red-800', text: 'text-red-400' },
  };

  const percentage = Math.min(Math.max((score / 60) * 100, 5), 100);

  return (
    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Org Threat Level</span>
        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${levelColors[level].badge}`}>
          {level}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mt-3">
        <span className={`text-3xl font-bold font-mono ${levelColors[level].text}`}>{score}</span>
        <span className="text-xs text-gray-400">weighted score</span>
      </div>

      {/* Progress meter */}
      <div className="w-full bg-gray-800 h-2 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            level === 'CRITICAL'
              ? 'bg-red-500'
              : level === 'HIGH'
              ? 'bg-orange-500'
              : level === 'ELEVATED'
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>0 LOW</span>
        <span>10 ELEV</span>
        <span>25 HIGH</span>
        <span>50+ CRIT</span>
      </div>
    </div>
  );
};
