import React from 'react';
import { Incident, IncidentEvent } from '@/types/models.types';
import { formatRelative, formatDuration } from '@/utils/formatters/dateFormatter';
import { PRIORITY_COLORS } from '@/constants/app.constants';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.constants';

interface AlertsSectionProps {
  atRisk?: Incident[];
  feed?: IncidentEvent[];
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  atRisk = [],
  feed = [],
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* At-Risk SLA Incidents */}
      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">SLA At-Risk Queue</h3>
            <p className="text-[11px] text-gray-400">Open incidents close to breach threshold</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
            {atRisk.length} At Risk
          </span>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
          {atRisk.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              All active incidents currently within SLA target
            </div>
          ) : (
            atRisk.map((inc) => (
              <Link
                key={inc.id}
                to={ROUTES.INCIDENT_DETAILS(inc.id)}
                className="block p-3 rounded bg-gray-950 hover:bg-gray-800/80 border border-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: PRIORITY_COLORS[inc.priority].bg,
                        color: PRIORITY_COLORS[inc.priority].text,
                        borderColor: PRIORITY_COLORS[inc.priority].border,
                      }}
                    >
                      {inc.priority}
                    </span>
                    <span className="text-xs font-mono text-gray-300 font-medium">
                      {inc.code}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-red-400 font-semibold">
                    {formatDuration(inc.timeRemainingSeconds)}
                  </span>
                </div>
                <div className="text-xs text-gray-300 mt-1 truncate">{inc.title}</div>
                <div className="text-[11px] text-gray-500 mt-1 flex justify-between">
                  <span>Assignee: {inc.assignee?.fullName || 'Unassigned'}</span>
                  <span className="capitalize">{inc.status.toLowerCase().replace('_', ' ')}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Live Event Feed */}
      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Live Incident Activity Feed</h3>
            <p className="text-[11px] text-gray-400">Real-time audit log & status transitions</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
          {feed.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              No recent security event log entries
            </div>
          ) : (
            feed.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded bg-gray-950 border border-gray-800/80 text-xs"
              >
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span className="font-mono text-blue-400 font-medium">{evt.type}</span>
                  <span>{formatRelative(evt.createdAt)}</span>
                </div>
                <div className="text-gray-300 mt-1">
                  <span className="font-medium text-gray-200">
                    {evt.actorName || 'System'}:
                  </span>{' '}
                  {typeof evt.payload?.note === 'string'
                    ? evt.payload.note
                    : `Triggered ${evt.type.toLowerCase().replace('_', ' ')} event`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
