import React, { useState, useEffect } from 'react';
import { IncidentCard, IncidentItem } from './IncidentCard';
import { IncidentDrawer } from './IncidentDrawer';
import { WhyAssigned } from './WhyAssigned';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { IncidentStatus } from '@/types/common.types';

interface IncidentBoardProps {
  incidents: IncidentItem[];
  loading?: boolean;
  onRefresh?: () => void;
}

const COLUMNS: { key: IncidentStatus; title: string; statuses: IncidentStatus[]; color: string }[] = [
  { key: 'OPEN', title: 'Open & Triage', statuses: ['OPEN', 'TRIAGED'], color: 'border-blue-500/40 text-blue-400' },
  { key: 'IN_PROGRESS', title: 'Active Containment', statuses: ['IN_PROGRESS'], color: 'border-amber-500/40 text-amber-400' },
  { key: 'RESOLVED', title: 'Remediated', statuses: ['RESOLVED'], color: 'border-emerald-500/40 text-emerald-400' },
  { key: 'CLOSED', title: 'Closed & Archived', statuses: ['CLOSED'], color: 'border-gray-600/40 text-gray-400' },
];

export const IncidentBoard: React.FC<IncidentBoardProps> = ({
  incidents,
  loading = false,
  onRefresh,
}) => {
  const { addToast } = useAppStore();
  const [boardIncidents, setBoardIncidents] = useState<IncidentItem[]>(incidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [whyIncident, setWhyIncident] = useState<IncidentItem | null>(null);

  useEffect(() => {
    setBoardIncidents(incidents);
  }, [incidents]);

  const handleDrop = async (targetColumn: IncidentStatus, e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    try {
      const data = JSON.parse(raw) as { id: string; status: IncidentStatus };
      if (!data.id || data.status === targetColumn) return;

      // Validate transitions
      // OPEN/TRIAGED cannot jump directly to RESOLVED or CLOSED
      if ((data.status === 'OPEN' || data.status === 'TRIAGED') && (targetColumn === 'RESOLVED' || targetColumn === 'CLOSED')) {
        addToast({
          type: 'warning',
          message: 'Direct transition from OPEN to RESOLVED is prohibited. Move to IN_PROGRESS first.',
        });
        return;
      }

      // CLOSED cannot transition anywhere
      if (data.status === 'CLOSED') {
        addToast({
          type: 'warning',
          message: 'Closed incidents cannot be moved.',
        });
        return;
      }

      // Optimistic update
      const previousIncidents = [...boardIncidents];
      setBoardIncidents((prev) =>
        prev.map((inc) => (inc.id === data.id ? { ...inc, status: targetColumn } : inc))
      );

      try {
        await apiClient.patch(`/api/incidents/${data.id}/status`, {
          status: targetColumn,
          message: `Moved via Kanban to ${targetColumn}`,
        });
        addToast({
          type: 'success',
          message: `Incident moved to ${targetColumn}`,
        });
        onRefresh?.();
      } catch (err: unknown) {
        // Rollback optimistic update on failure (e.g. 409 Conflict)
        setBoardIncidents(previousIncidents);
        const apiErr = err as { message?: string };
        addToast({
          type: 'error',
          message: apiErr.message || 'Status transition rejected',
        });
      }
    } catch {
      // Ignore invalid drag payload
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg">
        Synchronizing incident board...
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colIncidents = boardIncidents.filter((i) => col.statuses.includes(i.status));

          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(col.key, e)}
              className="bg-gray-900/60 border border-gray-800 rounded-lg p-3 space-y-3 min-h-[450px] flex flex-col transition-colors hover:border-gray-700"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-gray-800 text-gray-300 font-mono text-[10px]">
                    {colIncidents.length}
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {colIncidents.length === 0 ? (
                  <div className="py-12 text-center text-gray-600 text-xs border border-dashed border-gray-800/80 rounded">
                    No incidents in this stage
                  </div>
                ) : (
                  colIncidents.map((inc) => (
                    <IncidentCard
                      key={inc.id}
                      incident={inc}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      onWhyClick={() => setWhyIncident(inc)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Incident Details Drawer */}
      <IncidentDrawer
        incidentId={selectedIncidentId}
        isOpen={!!selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
        onIncidentUpdated={() => {
          onRefresh?.();
        }}
      />

      {/* Why Assigned Modal */}
      {whyIncident && (
        <WhyAssigned
          isOpen={!!whyIncident}
          onClose={() => setWhyIncident(null)}
          incidentCode={whyIncident.code}
          explanation={whyIncident.assignmentExplanation}
        />
      )}
    </>
  );
};
export default IncidentBoard;
