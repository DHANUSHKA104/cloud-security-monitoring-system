import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIncident, useIncidentTimeline } from '@/features/incidents';
import { PriorityBadge, StatusBadge, SlaTimer } from '@/features/incidents';
import { formatDateTime } from '@/utils/formatters/dateFormatter';
import { ROUTES } from '@/constants/routes.constants';

export const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading } = useIncident(id || '');
  const { data: timeline } = useIncidentTimeline(id || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 text-center text-xs text-gray-400">
        Incident not found. <Link to={ROUTES.INCIDENTS} className="text-blue-400 underline">Return to incidents</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link to={ROUTES.INCIDENTS} className="text-xs text-blue-400 hover:underline">
          &larr; Back to Incidents
        </Link>
        <SlaTimer
          timeRemainingSeconds={incident.timeRemainingSeconds}
          slaState={incident.slaState}
        />
      </div>

      <div className="p-6 rounded-lg bg-gray-900 border border-gray-800 space-y-4">
        <div className="flex items-center gap-3">
          <PriorityBadge priority={incident.priority} />
          <span className="font-mono text-sm text-gray-300 font-bold">{incident.code}</span>
          <StatusBadge status={incident.status} />
        </div>

        <h1 className="text-lg font-bold text-gray-100">{incident.title}</h1>
        <p className="text-xs text-gray-300 leading-relaxed">{incident.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-800 text-xs">
          <div>
            <span className="text-gray-500 block">Category</span>
            <span className="text-gray-200 font-mono text-[11px]">{incident.category}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Assignee</span>
            <span className="text-gray-200 font-medium">
              {incident.assignee?.fullName || 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Created At</span>
            <span className="text-gray-300">{formatDateTime(incident.createdAt)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">SLA Target Due</span>
            <span className="text-gray-300">{formatDateTime(incident.slaDueAt)}</span>
          </div>
        </div>
      </div>

      {/* Why this analyst explanation */}
      {incident.assignmentExplanation && (
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-200 mb-2">
            Why this analyst? (100-Point Scoring Algorithm)
          </h3>
          <div className="space-y-2">
            {incident.assignmentExplanation.candidates.map((cand) => (
              <div
                key={cand.userId}
                className="p-2.5 rounded bg-gray-950 border border-gray-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-gray-200">{cand.fullName}</span>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Skill: {cand.skill}/40 | Workload: {cand.workload}/30 | History: {cand.history}/20 | Runway: {cand.runway}/10
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-400">{cand.total} pts</span>
                  {incident.assignmentExplanation?.winner === cand.userId && (
                    <span className="ml-2 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
                      Selected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Timeline */}
      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
        <h3 className="text-xs font-semibold text-gray-200 mb-3">Audit Timeline</h3>
        <div className="space-y-2">
          {timeline?.map((evt) => (
            <div key={evt.id} className="p-2 text-xs border-l-2 border-blue-500 pl-3">
              <div className="flex justify-between text-[10px] text-gray-500">
                <span className="font-mono text-gray-400">{evt.type}</span>
                <span>{formatDateTime(evt.createdAt)}</span>
              </div>
              <div className="text-gray-300 mt-0.5">
                {evt.actorName || 'System'}: {JSON.stringify(evt.payload || {})}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default IncidentDetails;
