
import React, { useState } from 'react';
import { rawAxiosInstance } from '@/lib/axios';

type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

interface PlaybookStep {
  title: string;
  description: string;
}

interface PlaybookExecution {
  id: number;
  category: string;
  incidentId: string;
}

interface PlaybookProgress {
  id: number;
  stepTitle: string;
  description: string;
  status: StepStatus;
}

const Playbooks: React.FC = () => {
  const [category, setCategory] = useState('AUTH_ATTACK');
  const [steps, setSteps] = useState<PlaybookStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [incidentId, setIncidentId] = useState('');
  const [execution, setExecution] = useState<PlaybookExecution | null>(null);
  const [progress, setProgress] = useState<PlaybookProgress[]>([]);
  const [executing, setExecuting] = useState(false);

  // Load recommended playbook steps
  const loadPlaybook = async () => {
    setLoading(true);
    setError('');
    setSteps([]);

    try {
      const response = await rawAxiosInstance.get<PlaybookStep[]>(
        `/api/playbooks/${encodeURIComponent(category)}`
      );

      setSteps(response.data);
    } catch (err) {
      const apiError = err as Error & { status?: number };

      setError(
        apiError.status
          ? `Unable to load playbook (${apiError.status}).`
          : apiError.message || 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Create a playbook execution and save its steps
  const executePlaybook = async () => {
    if (!incidentId.trim()) {
      setError('Please enter an incident ID.');
      return;
    }

    setExecuting(true);
    setError('');
    setExecution(null);
    setProgress([]);

    try {
      const response = await rawAxiosInstance.post<PlaybookExecution>(
        '/api/playbooks/executions',
        {
          category,
          incidentId: incidentId.trim(),
        }
      );

      setExecution(response.data);

      const progressResponse = await rawAxiosInstance.get<PlaybookProgress[]>(
        `/api/playbooks/progress/execution/${response.data.id}`
      );

      setProgress(progressResponse.data);
    } catch (err) {
      const apiError = err as Error & { status?: number };

      setError(
        apiError.status
          ? `Unable to execute playbook (${apiError.status}).`
          : apiError.message || 'Something went wrong.'
      );
    } finally {
      setExecuting(false);
    }
  };

  // Update the status of an individual response step
  const updateStepStatus = async (
    stepId: number,
    status: StepStatus
  ) => {
    setError('');

    try {
      await rawAxiosInstance.patch(
        `/api/playbooks/progress/${stepId}`,
        { status }
      );

      if (execution) {
        const response = await rawAxiosInstance.get<PlaybookProgress[]>(
          `/api/playbooks/progress/execution/${execution.id}`
        );

        setProgress(response.data);
      }
    } catch (err) {
      const apiError = err as Error & { status?: number };

      setError(
        apiError.status
          ? `Unable to update step (${apiError.status}).`
          : apiError.message || 'Something went wrong.'
      );
    }
  };

  return (
    <div className="min-h-full p-6 text-gray-100">
      <h1 className="text-2xl font-bold">
        Playbook Automation
      </h1>

      <p className="mt-2 text-gray-400">
        View and track recommended response steps for security incidents.
      </p>

      <div className="mt-6 max-w-2xl rounded-xl border border-gray-700 bg-gray-900 p-5">
        <label
          htmlFor="playbook-category"
          className="mb-2 block text-sm font-medium"
        >
          Incident Category
        </label>

        <select
          id="playbook-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-gray-100"
        >
          <option value="AUTH_ATTACK">
            Authentication Attack
          </option>
          <option value="NETWORK_INTRUSION">
            Network Intrusion
          </option>
          <option value="OTHER">
            Other Incident
          </option>
        </select>

        <button
          type="button"
          onClick={loadPlaybook}
          disabled={loading}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Playbook'}
        </button>

        <div className="mt-6 border-t border-gray-700 pt-5">
          <label
            htmlFor="incident-id"
            className="mb-2 block text-sm font-medium"
          >
            Incident ID
          </label>

          <input
            id="incident-id"
            type="text"
            value={incidentId}
            onChange={(event) => setIncidentId(event.target.value)}
            placeholder="Enter incident UUID"
            className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white"
          />

          <button
            type="button"
            onClick={executePlaybook}
            disabled={executing}
            className="mt-3 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-500 disabled:opacity-50"
          >
            {executing ? 'Executing...' : 'Execute Playbook'}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Recommended steps preview */}
      <section className="mt-8 max-w-2xl">
        <h2 className="text-xl font-semibold">
          Recommended Response Steps
        </h2>

        {!loading && !error && steps.length === 0 && (
          <p className="mt-3 text-gray-400">
            Select a category and click Load Playbook to view its steps.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <article
              key={`${step.title}-${index}`}
              className="rounded-xl border border-gray-700 bg-gray-900 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 font-semibold text-blue-300">
                  {index + 1}
                </span>

                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Saved execution progress */}
      {execution && (
        <section className="mt-8 max-w-2xl">
          <h2 className="text-xl font-semibold">
            Playbook Execution Progress
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Execution ID: {execution.id}
          </p>

          <div className="mt-4 space-y-3">
            {progress.map((step, index) => (
              <article
                key={step.id}
                className="rounded-xl border border-gray-700 bg-gray-900 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">
                      {index + 1}. {step.stepTitle}
                    </h3>

                    <p className="mt-1 text-sm text-gray-400">
                      {step.description}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-blue-300">
                    {step.status.replace('_', ' ')}
                  </span>
                </div>

                <label
                  htmlFor={`status-${step.id}`}
                  className="mt-4 block text-sm text-gray-300"
                >
                  Update status
                </label>

                <select
                  id={`status-${step.id}`}
                  value={step.status}
                  onChange={(event) =>
                    updateStepStatus(
                      step.id,
                      event.target.value as StepStatus
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-800 p-2 text-gray-100"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Playbooks;
