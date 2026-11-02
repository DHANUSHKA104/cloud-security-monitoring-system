import React, { useState, useEffect, useCallback } from 'react';
import { playbookService } from '../services/playbookService';
import { IncidentPlaybookStatus, StepExecutionDetail } from '../types/playbook.types';
import { Button } from '@/components/ui/Button';

interface PlaybookChecklistProps {
  incidentId: string;
  canExecute: boolean;
  onStepExecuted?: () => void;
}

export const PlaybookChecklist: React.FC<PlaybookChecklistProps> = ({
  incidentId,
  canExecute,
  onStepExecuted,
}) => {
  const [playbookData, setPlaybookData] = useState<IncidentPlaybookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executingStepId, setExecutingStepId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<{ [stepId: string]: string }>({});
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const fetchPlaybook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playbookService.getIncidentPlaybook(incidentId);
      setPlaybookData(data);
    } catch (err: any) {
      console.error('Failed to load incident playbook', err);
      setError(err?.response?.data?.message || 'No response playbook configured for this incident category');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchPlaybook();
  }, [fetchPlaybook]);

  const handleExecute = async (step: StepExecutionDetail) => {
    try {
      setExecutingStepId(step.stepId);
      const notes = notesInput[step.stepId]?.trim() || undefined;
      await playbookService.executeStep(incidentId, step.stepId, {
        status: 'COMPLETED',
        notes,
      });
      await fetchPlaybook();
      onStepExecuted?.();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to execute playbook step');
    } finally {
      setExecutingStepId(null);
    }
  };

  const getActionTypeBadge = (type: string) => {
    switch (type) {
      case 'AUTOMATED_SIMULATED':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/40';
      case 'VERIFICATION':
        return 'bg-purple-950/70 text-purple-300 border-purple-500/40';
      default:
        return 'bg-blue-950/70 text-blue-300 border-blue-500/40';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-900/60 rounded-xl border border-purple-900/20 text-center text-gray-400 text-xs">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
        Loading response playbook checklist...
      </div>
    );
  }

  if (error || !playbookData) {
    return (
      <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-800 text-xs text-gray-400">
        <p className="font-semibold text-gray-300">Playbook Guidance</p>
        <p className="mt-1">{error || 'No active response SOP assigned.'}</p>
      </div>
    );
  }

  const progressPercent =
    playbookData.totalSteps > 0
      ? Math.round((playbookData.completedSteps / playbookData.totalSteps) * 100)
      : 0;

  return (
    <div className="p-5 bg-gray-900/60 rounded-xl border border-purple-900/25 shadow-lg space-y-4">
      {/* Header with Title and Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
              {playbookData.playbookCode}
            </span>
            <h3 className="text-sm font-bold text-gray-100">{playbookData.playbookTitle}</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Category SOP checklist ({playbookData.completedSteps} of {playbookData.totalSteps} steps completed)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32 bg-gray-800 rounded-full h-2.5 overflow-hidden border border-gray-700">
            <div
              className="bg-gradient-to-r from-purple-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-purple-300">{progressPercent}%</span>
        </div>
      </div>

      {/* Step Checklist Items */}
      <div className="space-y-3">
        {playbookData.steps.map((step) => {
          const isDone = step.executed && step.status === 'COMPLETED';
          const isExecuting = executingStepId === step.stepId;
          const isExpanded = expandedStepId === step.stepId;

          return (
            <div
              key={step.stepId}
              className={`p-3.5 rounded-lg border transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-gray-950/70 border-purple-900/20 hover:border-purple-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500 text-gray-950'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    {isDone ? '✓' : step.stepOrder}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isDone ? 'text-emerald-200 line-through' : 'text-gray-100'}`}>
                        {step.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${getActionTypeBadge(step.actionType)}`}>
                        {step.actionType.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${getRiskBadge(step.riskLevel)}`}>
                        Risk: {step.riskLevel}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">{step.instructions}</p>

                    {isDone && (
                      <div className="mt-2 text-[11px] text-emerald-400/90 font-mono flex items-center gap-2">
                        <span>Completed by {step.executedByName || 'Operator'}</span>
                        {step.executedAt && (
                          <span>at {new Date(step.executedAt).toLocaleTimeString()}</span>
                        )}
                        {step.notes && <span className="text-gray-300">— &ldquo;{step.notes}&rdquo;</span>}
                      </div>
                    )}

                    {!isDone && canExecute && isExpanded && (
                      <div className="mt-2.5 space-y-2">
                        <input
                          type="text"
                          placeholder="Optional execution notes (e.g. WAF rule ID, ticket ref)..."
                          value={notesInput[step.stepId] || ''}
                          onChange={(e) =>
                            setNotesInput((prev) => ({
                              ...prev,
                              [step.stepId]: e.target.value,
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-gray-900 border border-purple-900/40 rounded text-xs text-gray-200 placeholder-gray-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!isDone && canExecute && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedStepId(isExpanded ? null : step.stepId)
                        }
                        className="text-[11px] text-purple-400 hover:text-purple-300 px-2 py-1"
                      >
                        {isExpanded ? 'Collapse' : 'Add Note'}
                      </button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isExecuting}
                        onClick={() => handleExecute(step)}
                        className="text-xs"
                      >
                        {isExecuting ? 'Executing...' : step.actionType === 'AUTOMATED_SIMULATED' ? 'Run Action' : 'Complete'}
                      </Button>
                    </>
                  )}
                  {isDone && (
                    <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/60 rounded border border-emerald-500/30">
                      Done
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
