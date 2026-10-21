import React from 'react';

export const IncidentBoard: React.FC = () => {
  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-200">Incident Kanban Board</h3>
      <p className="text-xs text-gray-400 mt-1">Interactive triage board with drag-and-drop.</p>
    </div>
  );
};
