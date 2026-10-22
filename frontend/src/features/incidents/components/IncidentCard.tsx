import React from 'react';
import { Priority, IncidentStatus, SlaState } from '@/types/common.types';
import { PriorityBadge } from './PriorityBadge';
import { SlaTimer } from './SlaTimer';

export interface IncidentItem {
  id: string;
  code: string;
  title: string;
  description?: string;
  priority: Priority;
  status: IncidentStatus;
  category: string;
  teamId?: string;
  teamName?: string;
  assignee?: { id: string; fullName: string };
  createdAt: string;
  slaDueAt: string;
  slaState: SlaState;
  timeRemainingSeconds: number;
  escalationLevel: number;
  assetId?: string;
  assignmentExplanation?: any;
}

interface IncidentCardProps {
  incident: IncidentItem;
  onClick?: () => void;
  onWhyClick?: (e: React.MouseEvent) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onClick,
  onWhyClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 hover:bg-gray-850 cursor-pointer transition-all space-y-2.5 shadow-sm group"
    >
      {/* Top row: Code, Priority, Escalation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={incident.priority} />
          <span className="font-mono text-xs font-semibold text-sky-400 group-hover:underline">
            {incident.code}
          </span>
        </div>

        {incident.escalationLevel > 0 && (
          <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold animate-pulse">
            ESC L{incident.escalationLevel}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-xs font-medium text-gray-100 line-clamp-2 leading-relaxed">
        {incident.title}
      </h4>

      {/* Category tag */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="px-1.5 py-0.5 rounded bg-gray-950 text-gray-400 border border-gray-800 text-[10px] font-mono">
          {incident.category}
        </span>
        {incident.teamName && (
          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
            {incident.teamName}
          </span>
        )}
      </div>

      {/* Bottom row: Assignee, SLA Timer, Why Analyst button */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
        <div className="flex items-center gap-1.5 text-gray-300 truncate max-w-[120px]">
          <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-800 text-[10px] flex items-center justify-center text-blue-300 font-bold">
            {incident.assignee ? incident.assignee.fullName.charAt(0) : '?'}
          </span>
          <span className="text-[11px] truncate">
            {incident.assignee ? incident.assignee.fullName : 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {incident.assignmentExplanation && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWhyClick?.(e);
              }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/80 hover:bg-sky-900 transition-colors"
              title="Inspect smart routing candidate scores"
            >
              Why?
            </button>
          )}

          <SlaTimer
            timeRemainingSeconds={incident.timeRemainingSeconds}
            slaState={incident.slaState}
          />
        </div>
      </div>
    </div>
  );
};
export default IncidentCard;
