import React from 'react';

export const WorkflowBuilder: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">SOC Incident Lifecycle & Transition Rules</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Deterministic finite state machine with strict transition guards, object-level RBAC, and immutable audit logging
        </p>
      </div>

      {/* Visual State Machine Flow */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
        <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
          Incident Lifecycle State Machine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative pt-2">
          {/* Step 1 */}
          <div className="p-4 rounded-lg bg-gray-950 border border-blue-900/50 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800">
                STAGE 1
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <div className="font-bold text-sm text-gray-100">OPEN / TRIAGED</div>
            <p className="text-[11px] text-gray-400">
              Incoming threat event logged. Smart routing evaluates candidates and auto-assigns primary operator.
            </p>
            <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono">
              Allowed: &rarr; IN_PROGRESS
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-lg bg-gray-950 border border-amber-900/50 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                STAGE 2
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div className="font-bold text-sm text-gray-100">IN_PROGRESS</div>
            <p className="text-[11px] text-gray-400">
              Active forensic investigation, host isolation, credential revocation, and malware containment underway.
            </p>
            <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono">
              Allowed: &rarr; RESOLVED
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-lg bg-gray-950 border border-emerald-900/50 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                STAGE 3
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="font-bold text-sm text-gray-100">RESOLVED</div>
            <p className="text-[11px] text-gray-400">
              Threat neutralized, affected assets remediated. MTTR timestamp recorded. Pending sign-off.
            </p>
            <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono">
              Allowed: &rarr; CLOSED or REOPEN
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-lg bg-gray-950 border border-gray-800 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-800 text-gray-300 border border-gray-700">
                STAGE 4
              </span>
              <span className="w-2 h-2 rounded-full bg-gray-500" />
            </div>
            <div className="font-bold text-sm text-gray-100">CLOSED</div>
            <p className="text-[11px] text-gray-400">
              Post-incident review completed. Dossier archived to permanent cold storage. Immutable state.
            </p>
            <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono">
              Terminal State (No exit)
            </div>
          </div>
        </div>
      </div>

      {/* Guardrails & RBAC Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guardrails */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Enforced Transition Guardrails
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-gray-950 border border-red-900/40 text-gray-300">
              <div className="font-semibold text-red-400 mb-0.5">Prohibited Jump from OPEN to RESOLVED / CLOSED</div>
              <p className="text-[11px] text-gray-400">
                Incidents cannot skip investigation. Directly attempting to resolve without moving to IN_PROGRESS results in a <strong>409 Conflict</strong>.
              </p>
            </div>

            <div className="p-2.5 rounded bg-gray-950 border border-amber-900/40 text-gray-300">
              <div className="font-semibold text-amber-400 mb-0.5">Mandatory Reopen Justification (U12)</div>
              <p className="text-[11px] text-gray-400">
                A resolved incident cannot be reopened via normal status PATCH. It requires a dedicated <code>POST /api/incidents/{'{id}'}/reopen</code> call with a mandatory 5-500 character explanation.
              </p>
            </div>

            <div className="p-2.5 rounded bg-gray-950 border border-gray-800 text-gray-300">
              <div className="font-semibold text-gray-200 mb-0.5">Immutable Closed State</div>
              <p className="text-[11px] text-gray-400">
                Once marked CLOSED, the record is locked against further mutations to preserve forensic integrity for compliance audits.
              </p>
            </div>
          </div>
        </div>

        {/* RBAC Boundaries */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Object-Level Role Authorization Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="py-2 px-2 font-medium">Action</th>
                  <th className="py-2 px-2 font-medium">ADMIN</th>
                  <th className="py-2 px-2 font-medium">LEAD</th>
                  <th className="py-2 px-2 font-medium">ANALYST</th>
                  <th className="py-2 px-2 font-medium">VIEWER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                <tr>
                  <td className="py-2 px-2">View Incidents</td>
                  <td className="py-2 px-2 text-emerald-400">✓ All</td>
                  <td className="py-2 px-2 text-emerald-400">✓ All</td>
                  <td className="py-2 px-2 text-emerald-400">✓ All</td>
                  <td className="py-2 px-2 text-emerald-400">✓ Read-Only</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Status Transitions</td>
                  <td className="py-2 px-2 text-emerald-400">✓ All</td>
                  <td className="py-2 px-2 text-emerald-400">✓ Squad</td>
                  <td className="py-2 px-2 text-sky-400">✓ Assigned Only</td>
                  <td className="py-2 px-2 text-rose-400">✗</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Escalate Tier</td>
                  <td className="py-2 px-2 text-emerald-400">✓ Yes</td>
                  <td className="py-2 px-2 text-emerald-400">✓ Yes</td>
                  <td className="py-2 px-2 text-rose-400">✗ (Auto/Lead)</td>
                  <td className="py-2 px-2 text-rose-400">✗</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Reopen Incident</td>
                  <td className="py-2 px-2 text-emerald-400">✓ Yes</td>
                  <td className="py-2 px-2 text-emerald-400">✓ Yes</td>
                  <td className="py-2 px-2 text-rose-400">✗</td>
                  <td className="py-2 px-2 text-rose-400">✗</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">Configure Policies</td>
                  <td className="py-2 px-2 text-emerald-400">✓ Yes</td>
                  <td className="py-2 px-2 text-rose-400">✗</td>
                  <td className="py-2 px-2 text-rose-400">✗</td>
                  <td className="py-2 px-2 text-rose-400">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WorkflowBuilder;
