import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime } from '@/utils/formatters/dateFormatter';

interface Shift {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startsAt: string;
  endsAt: string;
}

interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface HandoverResponse {
  openCount: number;
  p1Count: number;
  p2Count: number;
  p3Count: number;
  p4Count: number;
  atRiskCount: number;
  resolvedLast8Hours: number;
  noCoverageCount: number;
  urgentIncidents: {
    code: string;
    title: string;
    assigneeName: string;
    minutesToDue: number;
  }[];
  templatedText: string;
}

interface ShiftHandoverResult {
  shiftId: string;
  analystId: string;
  analystName: string;
  handoverTime: string;
  notes: string;
  pendingIncidentCount: number;
  p1Count: number;
  p2Count: number;
  p3Count: number;
  p4Count: number;
  atRiskCount: number;
  resolvedLast8Hours: number;
  summary: string;
}

interface PageResponse<T> {
  content: T[];
}

export const ShiftCalendar: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Shift Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Handover Brief Modal
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverData, setHandoverData] = useState<HandoverResponse | null>(null);
  const [handoverLoading, setHandoverLoading] = useState(false);

  // Shift-Specific Handover Execution Modal
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [shiftToHandover, setShiftToHandover] = useState<Shift | null>(null);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [executingHandover, setExecutingHandover] = useState(false);
  const [handoverExecutionResult, setHandoverExecutionResult] = useState<ShiftHandoverResult | null>(null);

  const { addToast } = useAppStore();

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [allShiftsRes, onNowRes] = await Promise.all([
        apiClient.get<Shift[]>('/api/shifts'),
        apiClient.get<Shift[]>('/api/shifts/on-now'),
      ]);
      setShifts(allShiftsRes || []);
      setActiveShifts(onNowRes || []);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const openScheduleModal = async () => {
    try {
      setScheduleModalOpen(true);
      setScheduleError(null);

      const now = new Date();
      now.setMinutes(0, 0, 0);
      const later = new Date(now.getTime() + 8 * 60 * 60 * 1000);

      const toLocalIso = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
      };

      setStartsAt(toLocalIso(now));
      setEndsAt(toLocalIso(later));

      const res = await apiClient.get<PageResponse<UserSummary>>('/api/users?size=100&active=true');
      const list = (res.content || []).filter((u) => u.role === 'ANALYST' || u.role === 'ADMIN');
      setUsersList(list);
      if (list.length > 0) {
        setSelectedUserId(list[0].id);
      }
    } catch {
      // fallback
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);

    if (!selectedUserId || !startsAt || !endsAt) {
      setScheduleError('All fields are required');
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (endDate <= startDate) {
      setScheduleError('Shift end time must be after start time');
      return;
    }

    const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (diffHours > 16) {
      setScheduleError('Shift duration cannot exceed 16 hours');
      return;
    }

    try {
      setScheduleLoading(true);
      await apiClient.post('/api/shifts', {
        userId: selectedUserId,
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
      });

      addToast({
        type: 'success',
        message: 'Shift scheduled successfully',
      });
      setScheduleModalOpen(false);
      fetchShifts();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setScheduleError(apiErr.message || 'Failed to schedule shift');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleDeleteShift = async (shiftId: string, analystName: string) => {
    try {
      await apiClient.delete(`/api/shifts/${shiftId}`);
      addToast({
        type: 'success',
        message: `Shift for ${analystName} deleted`,
      });
      fetchShifts();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to delete shift',
      });
    }
  };

  const openHandoverBrief = async () => {
    try {
      setHandoverModalOpen(true);
      setHandoverLoading(true);
      const res = await apiClient.get<HandoverResponse>('/api/shifts/handover');
      setHandoverData(res);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to fetch handover brief',
      });
    } finally {
      setHandoverLoading(false);
    }
  };

  const openExecuteHandoverModal = (shift: Shift) => {
    setShiftToHandover(shift);
    setHandoverNotes('');
    setHandoverExecutionResult(null);
    setExecuteModalOpen(true);
  };

  const handleExecuteHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftToHandover) return;

    try {
      setExecutingHandover(true);
      const res = await apiClient.post<ShiftHandoverResult>(
        `/api/shifts/${shiftToHandover.id}/handover`,
        { notes: handoverNotes.trim() }
      );
      setHandoverExecutionResult(res);
      addToast({
        type: 'success',
        message: `Handover recorded for ${shiftToHandover.userName}`,
      });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to execute shift handover',
      });
    } finally {
      setExecutingHandover(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">24/7 SOC Shift Rosters</h2>
          <p className="text-xs text-gray-400">
            Ensure round-the-clock incident response coverage across rotation shifts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openHandoverBrief} variant="secondary" size="sm">
            📋 Handover Brief
          </Button>
          <Button onClick={openScheduleModal} size="sm">
            + Schedule Shift
          </Button>
        </div>
      </div>

      {/* Active On-Shift Banner */}
      <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-gray-200">
              Active Operators On-Shift Right Now ({activeShifts.length})
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            Auto-routing target pool
          </span>
        </div>

        {activeShifts.length === 0 ? (
          <div className="text-xs text-amber-400/90 py-1">
            ⚠️ Warning: No operators are actively on shift right now. New incidents will route to squad leads or administrators.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeShifts.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 bg-gray-900/90 border border-emerald-800/80 px-2.5 py-1 rounded text-xs text-gray-200"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="font-medium">{s.userName}</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  Until {new Date(s.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  type="button"
                  onClick={() => openExecuteHandoverModal(s)}
                  className="ml-1 text-[10px] text-sky-400 hover:text-sky-300 font-medium underline"
                >
                  Handover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Gantt Preview */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Today&apos;s Coverage Timeline (24h UTC)
          </h3>
          <span className="text-[11px] text-gray-500">Live operational window</span>
        </div>

        <div className="relative pt-6 pb-2">
          {/* Hour markers */}
          <div className="grid grid-cols-12 text-[10px] text-gray-500 font-mono border-b border-gray-800 pb-1">
            <span>00:00</span>
            <span>02:00</span>
            <span>04:00</span>
            <span>06:00</span>
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span>22:00</span>
          </div>

          {/* Timeline Bars */}
          <div className="relative h-16 mt-2 bg-gray-950/60 rounded border border-gray-800/80 overflow-hidden">
            {shifts.map((shift, idx) => {
              const start = new Date(shift.startsAt);
              const end = new Date(shift.endsAt);
              const now = new Date();
              const isCurrent = start <= now && end > now;

              const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
              const startMin = Math.max(0, (start.getTime() - startOfDay) / (1000 * 60));
              const endMin = Math.min(1440, (end.getTime() - startOfDay) / (1000 * 60));

              if (endMin <= 0 || startMin >= 1440) return null;

              const leftPct = (startMin / 1440) * 100;
              const widthPct = Math.max(2, ((endMin - startMin) / 1440) * 100);

              return (
                <div
                  key={shift.id}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    top: `${(idx % 2) * 28 + 4}px`,
                  }}
                  className={`absolute h-6 rounded px-2 flex items-center text-[10px] font-medium transition-all ${
                    isCurrent
                      ? 'bg-emerald-600/90 border border-emerald-400 text-white font-bold ring-1 ring-emerald-400/50'
                      : 'bg-gray-800/80 border border-gray-700 text-gray-400 opacity-60'
                  }`}
                  title={`${shift.userName} (${shift.userEmail}): ${formatDateTime(shift.startsAt)} - ${formatDateTime(shift.endsAt)}`}
                >
                  <span className="truncate">{shift.userName}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-1"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-gray-800 bg-gray-950/40 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Scheduled Shifts ({shifts.length})
          </h3>
          <span className="text-[11px] text-gray-500">Max 16h duration · Overlaps prevented</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">Loading schedule...</div>
        ) : shifts.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500">
            No shifts scheduled. Click &quot;+ Schedule Shift&quot; to assign analysts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/30 text-gray-400">
                  <th className="py-3 px-4 font-medium">Operator</th>
                  <th className="py-3 px-4 font-medium">Starts At</th>
                  <th className="py-3 px-4 font-medium">Ends At</th>
                  <th className="py-3 px-4 font-medium">Duration</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {shifts.map((shift) => {
                  const start = new Date(shift.startsAt);
                  const end = new Date(shift.endsAt);
                  const durationHours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
                  const isCurrent = start <= new Date() && end > new Date();

                  return (
                    <tr
                      key={shift.id}
                      className={`hover:bg-gray-800/30 transition-colors ${
                        isCurrent ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-100 flex items-center gap-2">
                          {shift.userName}
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                              ON-DUTY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">{shift.userEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{formatDateTime(shift.startsAt)}</td>
                      <td className="py-3 px-4 text-gray-300">{formatDateTime(shift.endsAt)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-400">
                        {durationHours} hrs
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openExecuteHandoverModal(shift)}
                            className="text-sky-400 hover:text-sky-300 text-[11px] font-medium"
                          >
                            Handover
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteShift(shift.id, shift.userName)}
                            className="text-rose-400 hover:text-rose-300 text-[11px] font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Shift Modal */}
      <Modal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Analyst Shift"
        maxWidth="md"
      >
        <div className="text-xs text-gray-400 mb-3">
          Assign an analyst to an operational SOC shift. Overlaps for the same analyst will be rejected.
        </div>
        <form onSubmit={handleCreateShift} className="space-y-3">
          {scheduleError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
              {scheduleError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Analyst Operator</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              required
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Start Time (UTC)</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">End Time (UTC)</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setScheduleModalOpen(false)}
              disabled={scheduleLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={scheduleLoading}>
              {scheduleLoading ? 'Scheduling...' : 'Schedule Shift'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Handover Brief Modal */}
      <Modal
        open={handoverModalOpen}
        onClose={() => setHandoverModalOpen(false)}
        title="Shift Handover Brief"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Operational incident posture and workload summary for the incoming shift team.
          </p>
          {handoverLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Generating handover summary...
            </div>
          ) : handoverData ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded bg-gray-950 border border-gray-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Open Incidents</div>
                  <div className="text-base font-bold text-gray-100 mt-1">{handoverData.openCount}</div>
                </div>
                <div className="p-2.5 rounded bg-gray-950 border border-red-900/50">
                  <div className="text-[10px] text-red-400 uppercase font-medium">P1 Critical</div>
                  <div className="text-base font-bold text-red-400 mt-1">{handoverData.p1Count}</div>
                </div>
                <div className="p-2.5 rounded bg-gray-950 border border-amber-900/50">
                  <div className="text-[10px] text-amber-400 uppercase font-medium">At SLA Risk</div>
                  <div className="text-base font-bold text-amber-400 mt-1">{handoverData.atRiskCount}</div>
                </div>
                <div className="p-2.5 rounded bg-gray-950 border border-emerald-900/50">
                  <div className="text-[10px] text-emerald-400 uppercase font-medium">Resolved (8h)</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    {handoverData.resolvedLast8Hours}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Priority Incidents Requiring Attention</h4>
                {handoverData.urgentIncidents && handoverData.urgentIncidents.length === 0 ? (
                  <p className="text-gray-500 py-3 text-center border border-dashed border-gray-800 rounded">
                    No urgent incidents currently active.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-gray-800 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-950/60 text-gray-400 border-b border-gray-800">
                        <tr>
                          <th className="py-2 px-3">Code</th>
                          <th className="py-2 px-3">Title</th>
                          <th className="py-2 px-3">Assignee</th>
                          <th className="py-2 px-3 text-right">Time to SLA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {(handoverData.urgentIncidents || []).map((inc) => (
                          <tr key={inc.code} className="hover:bg-gray-800/30">
                            <td className="py-2 px-3 font-mono text-sky-400">{inc.code}</td>
                            <td className="py-2 px-3 font-medium text-gray-200">{inc.title}</td>
                            <td className="py-2 px-3 text-gray-400">{inc.assigneeName}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className={inc.minutesToDue < 30 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                                {inc.minutesToDue}m
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-500">
              No handover data could be loaded.
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-gray-800">
            <Button variant="secondary" onClick={() => setHandoverModalOpen(false)}>
              Close Brief
            </Button>
          </div>
        </div>
      </Modal>

      {/* Shift-Specific Handover Execution Modal */}
      <Modal
        open={executeModalOpen}
        onClose={() => setExecuteModalOpen(false)}
        title={`Execute Handover: ${shiftToHandover?.userName || 'Operator'}`}
        maxWidth="md"
      >
        {handoverExecutionResult ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded text-emerald-300 text-xs font-medium">
              ✅ Shift handover recorded successfully on backend.
            </div>

            <div className="p-3 bg-gray-950 border border-gray-800 rounded text-xs space-y-2">
              <div className="font-semibold text-gray-200">Backend Incident Calculation:</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-300">
                <div>Total Pending: {handoverExecutionResult.pendingIncidentCount}</div>
                <div>SLA At Risk: {handoverExecutionResult.atRiskCount}</div>
                <div>P1: {handoverExecutionResult.p1Count} · P2: {handoverExecutionResult.p2Count}</div>
                <div>P3: {handoverExecutionResult.p3Count} · P4: {handoverExecutionResult.p4Count}</div>
              </div>
              <div className="text-[11px] text-gray-400 italic mt-2">
                &quot;{handoverExecutionResult.summary}&quot;
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-800">
              <Button
                variant="secondary"
                onClick={() => {
                  setExecuteModalOpen(false);
                  setHandoverExecutionResult(null);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleExecuteHandover} className="space-y-4">
            <div className="text-xs text-gray-400">
              Complete shift handover for {shiftToHandover?.userName}. The backend will automatically tally pending incidents and compile the shift status.
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Handover Remarks & In-Flight Context
              </label>
              <textarea
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="e.g. Completed triage on P2 brute force alerts. Pending investigation on database lateral movement in prod cluster."
                rows={4}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setExecuteModalOpen(false)}
                disabled={executingHandover}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={executingHandover}>
                {executingHandover ? 'Processing...' : 'Complete Handover'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ShiftCalendar;
