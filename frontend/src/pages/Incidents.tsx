import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IncidentBoard, IncidentForm, IncidentItem } from '@/features/incidents';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api/apiClient';
import { useAuthStore } from '@/store/useAuthStore';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

export const Incidents: React.FC = () => {
  const { user } = useAuthStore();
  const isViewer = user?.role === 'VIEWER';

  const [searchParams, setSearchParams] = useSearchParams();

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters initialized from URL query params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [slaStateFilter, setSlaStateFilter] = useState(searchParams.get('slaState') || '');
  const [formOpen, setFormOpen] = useState(false);

  // Synchronize state with URL search params
  const updateFilter = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val.trim()) {
      next.set(key, val.trim());
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const handleResetFilters = () => {
    setSearch('');
    setPriorityFilter('');
    setCategoryFilter('');
    setSlaStateFilter('');
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(search || priorityFilter || categoryFilter || slaStateFilter);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('size', '100');
      if (search.trim()) params.append('q', search.trim());
      if (priorityFilter) params.append('priority', priorityFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (slaStateFilter) params.append('slaState', slaStateFilter);

      const res = await apiClient.get<PageResponse<IncidentItem>>(`/api/incidents?${params.toString()}`);
      setIncidents(res.content || []);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [search, priorityFilter, categoryFilter, slaStateFilter]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 4000);
    return () => clearInterval(interval);
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

        {!isViewer && (
          <Button onClick={() => setFormOpen(true)} size="sm">
            + Raise Incident
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search code, title or evidence..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateFilter('q', e.target.value);
            }}
            className="w-full sm:w-56 bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              updateFilter('priority', e.target.value);
            }}
            className="bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              updateFilter('category', e.target.value);
            }}
            className="bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="AUTH_ATTACK">AUTH_ATTACK</option>
            <option value="DATA_EXFIL">DATA_EXFIL</option>
            <option value="RANSOMWARE">RANSOMWARE</option>
            <option value="NETWORK_INTRUSION">NETWORK_INTRUSION</option>
            <option value="POLICY_VIOLATION">POLICY_VIOLATION</option>
          </select>

          <select
            value={slaStateFilter}
            onChange={(e) => {
              setSlaStateFilter(e.target.value);
              updateFilter('slaState', e.target.value);
            }}
            className="bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All SLA Statuses</option>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk (&lt;30m)</option>
            <option value="BREACHED">Breached</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-blue-400 hover:text-blue-300 underline ml-1"
            >
              Reset filters
            </button>
          )}
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

      {/* Empty state with reset filters button if 0 results */}
      {incidents.length === 0 && !loading ? (
        <div className="p-12 text-center rounded-lg border border-dashed border-gray-800 bg-gray-900/40 space-y-3">
          <div className="text-gray-400 text-sm font-semibold">No incidents found matching current criteria</div>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try widening your filter parameters or resetting all applied filters.'
              : 'There are currently no security incidents recorded in the system.'}
          </p>
          {hasActiveFilters && (
            <Button size="sm" variant="secondary" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        /* Kanban Board */
        <IncidentBoard
          incidents={incidents}
          loading={loading}
          onRefresh={fetchIncidents}
        />
      )}

      {/* Raise Incident Modal */}
      {!isViewer && (
        <IncidentForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onCreated={fetchIncidents}
        />
      )}
    </div>
  );
};
export default Incidents;
