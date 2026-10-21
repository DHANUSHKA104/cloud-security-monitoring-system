import React from 'react';
import { SlaState } from '@/types/common.types';
import { SLA_STATE_COLORS } from '@/constants/app.constants';
import { formatDuration } from '@/utils/formatters/dateFormatter';

export const SlaTimer: React.FC<{
  timeRemainingSeconds: number;
  slaState: SlaState;
}> = ({ timeRemainingSeconds, slaState }) => {
  const c = SLA_STATE_COLORS[slaState];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {formatDuration(timeRemainingSeconds)}
    </span>
  );
};
