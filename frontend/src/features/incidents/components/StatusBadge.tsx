import React from 'react';
import { IncidentStatus } from '@/types/common.types';
import { STATUS_COLORS } from '@/constants/app.constants';

export const StatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  const c = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status.replace('_', ' ')}
    </span>
  );
};
