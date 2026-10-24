import React, { useState, useEffect } from 'react';
import { SlaState } from '@/types/common.types';
import { SLA_STATE_COLORS } from '@/constants/app.constants';
import { formatDuration } from '@/utils/formatters/dateFormatter';

export const SlaTimer: React.FC<{
  timeRemainingSeconds: number;
  slaState: SlaState;
}> = ({ timeRemainingSeconds: initialSeconds, slaState: initialSlaState }) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds ?? 0);

  useEffect(() => {
    setSeconds(initialSeconds ?? 0);
  }, [initialSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isBreached = seconds <= 0 || initialSlaState === 'BREACHED';
  const isAtRisk = (!isBreached && seconds < 300) || initialSlaState === 'AT_RISK';

  let currentSlaState: SlaState = initialSlaState;
  if (isBreached) {
    currentSlaState = 'BREACHED';
  } else if (isAtRisk) {
    currentSlaState = 'AT_RISK';
  }

  const c = SLA_STATE_COLORS[currentSlaState] || { bg: '#fee2e2', text: '#991b1b' };

  if (isNaN(seconds)) {
    return <span className="text-xs text-gray-500 font-mono">--:--</span>;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {seconds < 0 ? `+${formatDuration(Math.abs(seconds))} overdue` : formatDuration(seconds)}
      {seconds < 0 && <span className="uppercase text-[10px] tracking-wider font-bold">BREACHED</span>}
    </span>
  );
};
