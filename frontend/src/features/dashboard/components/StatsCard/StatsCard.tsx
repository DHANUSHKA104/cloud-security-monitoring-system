import React, { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  tone?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  icon?: ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  subtext,
  tone = 'default',
  icon,
}) => {
  const toneBorder = {
    default: 'border-gray-800',
    danger: 'border-red-800/80 bg-red-950/20',
    warning: 'border-amber-800/80 bg-amber-950/20',
    success: 'border-emerald-800/80 bg-emerald-950/20',
    info: 'border-blue-800/80 bg-blue-950/20',
  };

  const toneText = {
    default: 'text-gray-100',
    danger: 'text-red-400',
    warning: 'text-amber-400',
    success: 'text-emerald-400',
    info: 'text-blue-400',
  };

  return (
    <div className={`p-4 rounded-lg bg-gray-900 border ${toneBorder[tone]} shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold mt-2 ${toneText[tone]}`}>{value}</div>
      {subtext && <div className="text-[11px] text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
};
