import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { Priority } from '@/types/common.types';

interface Team {
  id: string;
  name: string;
}

interface IncidentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CATEGORIES = [
  { value: 'AUTH_ATTACK', label: 'AUTH_ATTACK — Authentication & Credential Stuffing' },
  { value: 'MALWARE', label: 'MALWARE — Ransomware & Malware Artifacts' },
  { value: 'DATA_EXPOSURE', label: 'DATA_EXPOSURE — Data Exfiltration & S3 Egress' },
  { value: 'NETWORK_INTRUSION', label: 'NETWORK_INTRUSION — Network Intrusion & C2 Activity' },
  { value: 'POLICY_VIOLATION', label: 'POLICY_VIOLATION — Compliance & Policy Violation' },
  { value: 'CLOUD_MISCONFIG', label: 'CLOUD_MISCONFIG — AWS / Cloud IAM Misconfiguration' },
];

export const IncidentForm: React.FC<IncidentFormProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P2');
  const [category, setCategory] = useState('AUTH_ATTACK');
  const [teamId, setTeamId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useAppStore();

  useEffect(() => {
    if (!isOpen) return;
    const fetchTeams = async () => {
      try {
        const res = await apiClient.get<Team[]>('/api/teams');
        setTeams(res || []);
      } catch {
        // Teams optional
      }
    };
    fetchTeams();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/api/incidents', {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        teamId: teamId || undefined,
        assetId: assetId.trim() || undefined,
      });

      addToast({
        type: 'success',
        message: 'Incident logged & smart-routed to on-duty analyst',
      });
      onCreated?.();
      onClose();

      // Reset
      setTitle('');
      setDescription('');
      setPriority('P2');
      setCategory('AUTH_ATTACK');
      setTeamId('');
      setAssetId('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to raise incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Raise Security Incident"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-400">
          Report an observed cloud threat. The system will start an SLA countdown timer and auto-route to the best available on-shift operator.
        </p>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
            {error}
          </div>
        )}

        <Input
          id="incident-title"
          label="Incident Title"
          placeholder="e.g., Multiple failed console logins across 3 IP addresses"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="inc-priority" className="block text-xs font-medium text-gray-300 mb-1">
              Priority & SLA Policy
            </label>
            <select
              id="inc-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="P1">P1 - Critical (15 min SLA)</option>
              <option value="P2">P2 - High (60 min SLA)</option>
              <option value="P3">P3 - Medium (4 hr SLA)</option>
              <option value="P4">P4 - Low (24 hr SLA)</option>
            </select>
          </div>

          <div>
            <label htmlFor="inc-category" className="block text-xs font-medium text-gray-300 mb-1">
              Threat Category
            </label>
            <select
              id="inc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="inc-team" className="block text-xs font-medium text-gray-300 mb-1">
              Target Squad (Optional)
            </label>
            <select
              id="inc-team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Any On-Duty Squad (Auto)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="inc-asset-id"
            label="Affected Cloud Asset (Optional)"
            placeholder="e.g., arn:aws:iam::123456789:role/Admin"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            maxLength={50}
          />
        </div>

        <div>
          <label htmlFor="inc-desc" className="block text-xs font-medium text-gray-300 mb-1">
            Detailed Narrative / IOC Artifacts
          </label>
          <textarea
            id="inc-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide observed log snippets, affected IP addresses or cloud accounts..."
            className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create & Route Incident
          </Button>
        </div>
      </form>
    </Modal>
  );
};
export default IncidentForm;
