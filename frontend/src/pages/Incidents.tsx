import React from 'react';
import { IncidentBoard } from '@/features/incidents';

export const Incidents: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Security Incidents</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Triage pipeline, smart routing assignment and real-time SLA tracking
          </p>
        </div>
      </div>

      <IncidentBoard />
    </div>
  );
};
export default Incidents;
