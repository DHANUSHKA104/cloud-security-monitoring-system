import React, { useState } from 'react';
import { ProcessList, ProcessStages, WorkflowBuilder } from '@/features/document-workflow';

export const Workflows: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'policies' | 'escalation' | 'lifecycle'>('policies');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-100">SLA Policies & Incident Workflows</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure response/resolution thresholds, automated escalation ladders and lifecycle state transitions
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-md border border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'policies'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            SLA Targets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('escalation')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'escalation'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Escalation Ladder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'lifecycle'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Workflow Lifecycle
          </button>
        </div>
      </div>

      {activeTab === 'policies' && <ProcessList />}
      {activeTab === 'escalation' && <ProcessStages />}
      {activeTab === 'lifecycle' && <WorkflowBuilder />}
    </div>
  );
};
export default Workflows;
