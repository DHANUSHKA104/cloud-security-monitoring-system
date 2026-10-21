import React from 'react';
import { Priority } from '@/types/common.types';
import { PRIORITY_COLORS } from '@/constants/app.constants';

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const c = PRIORITY_COLORS[priority];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border font-mono"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
    >
      {priority}
    </span>
  );
};
