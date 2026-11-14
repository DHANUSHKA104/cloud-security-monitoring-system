import React, { useState } from 'react';
import { useSlaPolicies } from '../../hooks';
import { slaPolicyService } from '../../services/slaPolicyService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PriorityBadge } from '@/features/incidents/components/PriorityBadge';
import { SlaPolicy } from '@/types/models.types';
import { Priority } from '@/types/common.types';

export const ProcessList: React.FC = () => {
  const { data: policies, isLoading, refetch } = useSlaPolicies();
  const { user } = useAuthStore();
  const { addToast } = useAppStore();
  const isAdmin = user?.role === 'ADMIN';

  // Edit Modal State
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | null>(null);
  const [resolveMinutes, setResolveMinutes] = useState(60);
  const [firstEscalationPct, setFirstEscalationPct] = useState(25);
  const [secondEscalationPct, setSecondEscalationPct] = useState(75);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = (p: SlaPolicy) => {
    setEditingPolicy(p);
    setResolveMinutes(p.resolveMinutes);
    setFirstEscalationPct(p.firstEscalationPct);
    setSecondEscalationPct(p.secondEscalationPct);
    setEditError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    setEditError(null);

    if (resolveMinutes < 1) {
      setEditError('Resolution minutes must be at least 1');
      return;
    }
    if (firstEscalationPct < 1 || firstEscalationPct >= secondEscalationPct) {
      setEditError('Level 1 percentage must be greater than 0 and less than Level 2');
      return;
    }
    if (secondEscalationPct >= 100) {
      setEditError('Level 2 percentage must be less than 100');
      return;
    }

    try {
      setIsSaving(true);
      await slaPolicyService.updatePolicy(editingPolicy.priority, {
        resolveMinutes,
        firstEscalationPct,
        secondEscalationPct,
      });

      addToast({
        type: 'success',
        message: `SLA policy for ${editingPolicy.priority} updated successfully`,
      });
      setEditingPolicy(null);
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setEditError(apiErr.message || 'Failed to update SLA policy');
    } finally {
      setIsSaving(false);
    }
  };

  const formatMinutes = (m: number) => {
    if (m < 60) return `${m} min`;
    const h = (m / 60).toFixed(1).replace('.0', '');
    return `${m} min (${h} hrs)`;
  };

  // Sort P1 -> P2 -> P3 -> P4
  const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
  const sortedPolicies = [...(policies || [])].sort(
    (a, b) => (priorityOrder[a.priority] || 9) - (priorityOrder[b.priority] || 9)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-900/60 p-4 rounded-lg border border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Operational SLA Targets</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Strict resolution thresholds, MTTR target windows, and automated tier escalation triggers
          </p>
        </div>
        {isAdmin && (
          <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded border border-blue-900/60">
            Admin Configuration Mode
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg">
          Loading SLA policies from backend...
        </div>
      ) : sortedPolicies.length === 0 ? (
        <div className="py-16 text-center text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-lg">
          No SLA policies found in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedPolicies.map((policy) => {
            const l1Mins = Math.round((policy.resolveMinutes * policy.firstEscalationPct) / 100);
            const l2Mins = Math.round((policy.resolveMinutes * policy.secondEscalationPct) / 100);

            return (
              <div
                key={policy.priority}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4 flex flex-col justify-between hover:border-gray-700 transition-colors shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <PriorityBadge priority={policy.priority} />
                    <span className="text-[10px] text-gray-400 font-mono">
                      Policy #{policy.priority}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Resolution Target
                    </span>
                    <div className="text-xl font-bold font-mono text-gray-100 mt-0.5">
                      {formatMinutes(policy.resolveMinutes)}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-800/80 text-xs">
                    <div className="flex justify-between items-center text-gray-300">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Level 1 (Squad Lead)
                      </span>
                      <span className="font-mono text-gray-200">
                        {policy.firstEscalationPct}% ({l1Mins}m)
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-300">
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Level 2 (Admin)
                      </span>
                      <span className="font-mono text-gray-200">
                        {policy.secondEscalationPct}% ({l2Mins}m)
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-400 pt-1 border-t border-gray-800/40">
                      <span className="text-[11px]">Dynamic Median Risk</span>
                      <span className="font-mono text-[11px] text-emerald-400">Active (90d)</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full mt-2"
                    onClick={() => openEditModal(policy)}
                  >
                    Configure Policy
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={!!editingPolicy}
        onClose={() => setEditingPolicy(null)}
        title={`Adjust SLA Policy for ${editingPolicy?.priority || ''}`}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <p className="text-xs text-gray-400">
            Define the mandatory resolution time window and automated tier escalation percentages for this incident priority.
          </p>

          {editError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-md">
              {editError}
            </div>
          )}

          <Input
            id="sla-resolve-minutes"
            label="Resolution SLA Target (Minutes)"
            type="number"
            min={1}
            max={10080}
            value={resolveMinutes}
            onChange={(e) => setResolveMinutes(parseInt(e.target.value) || 0)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="sla-l1-pct"
              label="Level 1 Escalation (% of SLA)"
              type="number"
              min={1}
              max={99}
              value={firstEscalationPct}
              onChange={(e) => setFirstEscalationPct(parseInt(e.target.value) || 0)}
              required
            />
            <Input
              id="sla-l2-pct"
              label="Level 2 Escalation (% of SLA)"
              type="number"
              min={1}
              max={99}
              value={secondEscalationPct}
              onChange={(e) => setSecondEscalationPct(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="p-3 bg-gray-950 border border-gray-800 rounded text-gray-400 text-[11px] space-y-1">
            <div className="font-semibold text-gray-300">Resulting Timeline:</div>
            <div>• Level 1 Lead Escalation at: <strong>{Math.round((resolveMinutes * firstEscalationPct) / 100)} minutes</strong></div>
            <div>• Level 2 Admin Escalation at: <strong>{Math.round((resolveMinutes * secondEscalationPct) / 100)} minutes</strong></div>
            <div>• Full SLA Breach at: <strong>{resolveMinutes} minutes</strong></div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingPolicy(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              Save Policy Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ProcessList;
