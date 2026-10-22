import React, { useState, useEffect, useCallback } from 'react';
import { IncidentBoard, IncidentForm, IncidentItem } from '@/features/incidents';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api/apiClient';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [slaStateFilter, setSlaStateFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('size', '100');
      if (search.trim()) params.append('q', search.trim());
      if (priorityFilter) params.append('priority', priorityFilter);
      if (slaStateFilter) params.append('slaState', slaStateFilter);

      const res = await apiClient.get<PageResponse<IncidentItem>>(`/api/incidents?${params.toString()}`);
      setIncidents(res.content || []);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [search, priorityFilter, slaStateFilter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Incident Triage & Response</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Active threat pipeline, smart routing assignment and SLA countdown tracking
          </p>
        </div>

        <Button onClick={() => setFormOpen(true)} size="sm">
          + Raise Incident
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search code, title or evidence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>

          <select
            value={slaStateFilter}
            onChange={(e) => setSlaStateFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All SLA Statuses</option>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk (&lt;30m)</option>
            <option value="BREACHED">Breached</option>
          </select>
        </div>

        <div className="text-gray-400 text-xs">
          Total Incidents: <span className="font-mono text-gray-200 font-bold">{incidents.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <IncidentBoard
        incidents={incidents}
        loading={loading}
        onRefresh={fetchIncidents}
      />

      {/* Raise Incident Modal */}
      <IncidentForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={fetchIncidents}
      />
    </div>
  );
};
export default Incidents;
