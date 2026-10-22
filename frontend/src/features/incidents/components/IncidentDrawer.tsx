import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { SlaTimer } from './SlaTimer';
import { WhyAssigned } from './WhyAssigned';
import { formatDateTime } from '@/utils/formatters/dateFormatter';
import { IncidentStatus } from '@/types/common.types';
import { IncidentItem } from './IncidentCard';

interface TimelineEvent {
  id: string;
  type: string;
  actor?: { id: string; fullName: string };
  payload?: any;
  createdAt: string;
}

interface IncidentDetailData {
  incident: IncidentItem;
  timeline: TimelineEvent[];
}

interface UserSummary {
  id: string;
  fullName: string;
  email: string;
}

interface PageResponse<T> {
  content: T[];
}

interface IncidentDrawerProps {
  incidentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onIncidentUpdated?: () => void;
}

export const IncidentDrawer: React.FC<IncidentDrawerProps> = ({
  incidentId,
  isOpen,
  onClose,
  onIncidentUpdated,
}) => {
  const [data, setData] = useState<IncidentDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Why Assigned Modal
  const [whyModalOpen, setWhyModalOpen] = useState(false);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status note modal
  const [statusAction, setStatusAction] = useState<IncidentStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Reassign modal
  const [reassignOpen, setReassignOpen] = useState(false);
  const [analysts, setAnalysts] = useState<UserSummary[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  const { addToast } = useAppStore();

  const fetchDetail = useCallback(async () => {
    if (!incidentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<IncidentDetailData>(`/api/incidents/${incidentId}`);
      setData(res);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load incident detail');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (isOpen && incidentId) {
      fetchDetail();
    }
  }, [isOpen, incidentId, fetchDetail]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await apiClient.post(`/api/incidents/${incidentId}/comments`, {
        text: commentText.trim(),
      });
      setCommentText('');
      addToast({ type: 'success', message: 'Comment added to timeline' });
      fetchDetail();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({ type: 'error', message: apiErr.message || 'Failed to add comment' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const executeStatusChange = async (newStatus: IncidentStatus) => {
    if (!incidentId) return;
    try {
      setStatusUpdating(true);
      await apiClient.patch(`/api/incidents/${incidentId}/status`, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });

      addToast({
        type: 'success',
        message: `Incident moved to ${newStatus}`,
      });
      setStatusAction(null);
      setStatusNote('');
      fetchDetail();
      onIncidentUpdated?.();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({ type: 'error', message: apiErr.message || 'Failed to transition status' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleEscalate = async () => {
    if (!incidentId) return;
    try {
      await apiClient.post(`/api/incidents/${incidentId}/escalate`, {
        reason: 'Manual tier escalation by operator',
      });
      addToast({ type: 'success', message: 'Incident escalated to squad lead' });
      fetchDetail();
      onIncidentUpdated?.();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({ type: 'error', message: apiErr.message || 'Escalation failed' });
    }
  };

  const handleReopen = async () => {
    if (!incidentId) return;
    try {
      await apiClient.post(`/api/incidents/${incidentId}/reopen`, {
        reason: 'Threat recurring; reopening for deeper investigation',
      });
      addToast({ type: 'success', message: 'Incident reopened to IN_PROGRESS' });
      fetchDetail();
      onIncidentUpdated?.();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({ type: 'error', message: apiErr.message || 'Failed to reopen incident' });
    }
  };

  const openReassignModal = async () => {
    try {
      setReassignOpen(true);
      const res = await apiClient.get<PageResponse<UserSummary>>('/api/users?size=100&role=ANALYST');
      const list = res.content || [];
      setAnalysts(list);
      if (list.length > 0) setSelectedAssigneeId(list[0].id);
    } catch {
      // Fallback
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId || !selectedAssigneeId) return;

    try {
      setReassignLoading(true);
      await apiClient.post(`/api/incidents/${incidentId}/assign`, {
        assigneeId: selectedAssigneeId,
        reason: reassignReason.trim() || undefined,
      });
      addToast({ type: 'success', message: 'Incident reassigned' });
      setReassignOpen(false);
      setReassignReason('');
      fetchDetail();
      onIncidentUpdated?.();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({ type: 'error', message: apiErr.message || 'Reassignment failed' });
    } finally {
      setReassignLoading(false);
    }
  };

  const inc = data?.incident;
  const timeline = data?.timeline || [];

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title={
          inc ? (
            <div className="flex items-center gap-2">
              <PriorityBadge priority={inc.priority} />
              <span className="font-mono text-sm text-sky-400">{inc.code}</span>
              <StatusBadge status={inc.status} />
            </div>
          ) : (
            'Incident Details'
          )
        }
        maxWidth="xl"
      >
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">Loading incident dossier...</div>
        ) : error || !inc ? (
          <div className="p-4 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
            {error || 'Incident not found'}
          </div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Header Title & SLA Banner */}
            <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-100">{inc.title}</h3>
                <span className="text-[11px] text-gray-400 font-mono">
                  Category: {inc.category} {inc.teamName && `· Squad: ${inc.teamName}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SlaTimer
                  timeRemainingSeconds={inc.timeRemainingSeconds}
                  slaState={inc.slaState}
                />
                {inc.assignmentExplanation && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setWhyModalOpen(true)}
                  >
                    Why this analyst?
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded bg-gray-900 border border-gray-800">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
                Workflow:
              </span>

              {inc.status === 'OPEN' && (
                <Button size="sm" onClick={() => executeStatusChange('IN_PROGRESS')}>
                  Accept & Investigate
                </Button>
              )}

              {inc.status === 'TRIAGED' && (
                <Button size="sm" onClick={() => executeStatusChange('IN_PROGRESS')}>
                  Begin Containment
                </Button>
              )}

              {inc.status === 'IN_PROGRESS' && (
                <Button size="sm" variant="primary" onClick={() => executeStatusChange('RESOLVED')}>
                  ✓ Mark Resolved
                </Button>
              )}

              {inc.status === 'RESOLVED' && (
                <>
                  <Button size="sm" onClick={() => executeStatusChange('CLOSED')}>
                    Close Incident
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleReopen}>
                    ↩ Reopen
                  </Button>
                </>
              )}

              {inc.status !== 'RESOLVED' && inc.status !== 'CLOSED' && (
                <>
                  <Button size="sm" variant="secondary" onClick={openReassignModal}>
                    Reassign
                  </Button>
                  {inc.escalationLevel < 2 && (
                    <Button size="sm" variant="danger" onClick={handleEscalate}>
                      ▲ Escalate (L{inc.escalationLevel + 1})
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-950/60 border border-gray-800 rounded-lg">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-medium">Assignee</span>
                <span className="text-gray-200 font-medium">
                  {inc.assignee ? inc.assignee.fullName : 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-medium">SLA Due At</span>
                <span className="text-gray-300 font-mono">{formatDateTime(inc.slaDueAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-medium">Reported At</span>
                <span className="text-gray-300 font-mono">{formatDateTime(inc.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-medium">Cloud Asset</span>
                <span className="text-gray-300 font-mono">{inc.assetId || 'N/A'}</span>
              </div>
            </div>

            {/* Description / Evidence */}
            {inc.description && (
              <div>
                <h4 className="font-semibold text-gray-300 mb-1">Threat Evidence & Logs</h4>
                <div className="p-3 bg-gray-950 border border-gray-800 rounded text-gray-300 font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {inc.description}
                </div>
              </div>
            )}

            {/* Timeline & Audit Events */}
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Audit Trail & Analyst Timeline</h4>
              <div className="border border-gray-800 rounded-lg bg-gray-950/40 p-3 max-h-56 overflow-y-auto space-y-3">
                {timeline.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events logged yet.</p>
                ) : (
                  timeline.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-2.5 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-gray-200 uppercase tracking-wider font-mono">
                            {evt.type.replace('_', ' ')}
                          </span>
                          <span className="text-gray-500 font-mono">
                            {formatDateTime(evt.createdAt)}
                          </span>
                        </div>
                        <div className="text-gray-400 mt-0.5">
                          {evt.actor && (
                            <span className="text-sky-400 mr-1.5 font-medium">
                              {evt.actor.fullName}:
                            </span>
                          )}
                          {evt.type === 'COMMENT_ADDED' && evt.payload?.text ? (
                            <span className="text-gray-200">{evt.payload.text}</span>
                          ) : evt.type === 'STATUS_CHANGED' ? (
                            <span>
                              Changed from {evt.payload?.fromStatus} to {evt.payload?.toStatus}
                              {evt.payload?.note && ` ("${evt.payload.note}")`}
                            </span>
                          ) : evt.type === 'ASSIGNED' ? (
                            <span>Assigned to {evt.payload?.assigneeName}</span>
                          ) : evt.type === 'ESCALATED' ? (
                            <span>Escalated to Level {evt.payload?.level} ({evt.payload?.escalatedToName})</span>
                          ) : evt.type === 'REOPENED' ? (
                            <span>Reopened: {evt.payload?.reason}</span>
                          ) : (
                            <span>{evt.type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-gray-800">
              <input
                type="text"
                placeholder="Post analyst investigation note or artifact hash..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <Button type="submit" size="sm" loading={submittingComment}>
                Add Note
              </Button>
            </form>
          </div>
        )}
      </Modal>

      {/* Why Assigned Modal */}
      {inc && (
        <WhyAssigned
          isOpen={whyModalOpen}
          onClose={() => setWhyModalOpen(false)}
          incidentCode={inc.code}
          explanation={inc.assignmentExplanation}
        />
      )}

      {/* Reassign Modal */}
      <Modal
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        title="Reassign Incident"
      >
        <form onSubmit={handleReassign} className="space-y-3 text-xs">
          <div>
            <label htmlFor="reassign-operator" className="block text-xs font-medium text-gray-300 mb-1">
              Select Operator
            </label>
            <select
              id="reassign-operator"
              value={selectedAssigneeId}
              onChange={(e) => setSelectedAssigneeId(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              {analysts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} ({a.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reassign-reason" className="block text-xs font-medium text-gray-300 mb-1">
              Transfer Reason
            </label>
            <input
              id="reassign-reason"
              type="text"
              placeholder="e.g. Specialized AWS knowledge required"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReassignOpen(false)}
              disabled={reassignLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={reassignLoading}>
              Reassign
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
export default IncidentDrawer;
