import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AssignmentExplanation } from '@/types';

interface WhyAssignedProps {
  explanation?: AssignmentExplanation | null;
  isOpen: boolean;
  onClose: () => void;
  incidentCode: string;
}

export const WhyAssigned: React.FC<WhyAssignedProps> = ({
  explanation,
  isOpen,
  onClose,
  incidentCode,
}) => {
  const candidates = explanation?.candidates || [];
  const noCoverage = explanation?.noCoverage;
  const winnerId = explanation?.winner;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Smart Routing Explanation — ${incidentCode}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Transparent 100-point routing algorithm matching incident attributes against on-duty SOC operators.
        </p>

        {noCoverage ? (
          <div className="p-3 bg-amber-950/40 border border-amber-800 text-amber-300 text-xs rounded-lg">
            ⚠ <strong>Coverage Gap:</strong> No eligible analyst was actively scheduled on-shift when this incident was ingested.
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No routing evaluation data is available for this incident.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto border border-gray-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-950/70 border-b border-gray-800 text-gray-400">
                    <th className="py-2.5 px-3 font-medium">Operator</th>
                    <th className="py-2.5 px-2 font-medium text-center">Skill (/40)</th>
                    <th className="py-2.5 px-2 font-medium text-center">Queue (/30)</th>
                    <th className="py-2.5 px-2 font-medium text-center">History (/15)</th>
                    <th className="py-2.5 px-2 font-medium text-center">Runway (/15)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {candidates.map((c) => {
                    const isWinner = c.userId === winnerId;
                    return (
                      <tr
                        key={c.userId}
                        className={`hover:bg-gray-800/30 transition-colors ${
                          isWinner ? 'bg-blue-950/20 font-medium' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-100">{c.fullName}</span>
                            {isWinner && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                                WINNER
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                          {c.skill}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                          {c.workload}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                          {c.history}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                          {c.runway}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-400">
                          {c.total} / 100
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-400 pt-1">
              <div className="p-2 rounded bg-gray-950 border border-gray-800/80">
                <span className="font-semibold text-gray-300 block mb-0.5">Skill (40 pts)</span>
                L1 (15), L2 (25), L3 (40) mapped to attack vector.
              </div>
              <div className="p-2 rounded bg-gray-950 border border-gray-800/80">
                <span className="font-semibold text-gray-300 block mb-0.5">Queue (30 pts)</span>
                Inversely weighted by current active load.
              </div>
              <div className="p-2 rounded bg-gray-950 border border-gray-800/80">
                <span className="font-semibold text-gray-300 block mb-0.5">History (15 pts)</span>
                Historical MTTR & prior resolutions in category.
              </div>
              <div className="p-2 rounded bg-gray-950 border border-gray-800/80">
                <span className="font-semibold text-gray-300 block mb-0.5">Runway (15 pts)</span>
                Remaining shift hours before handover.
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default WhyAssigned;
