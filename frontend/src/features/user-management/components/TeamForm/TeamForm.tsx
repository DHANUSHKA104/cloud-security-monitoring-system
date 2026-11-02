import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface TeamFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamToEdit?: Team | null;
}

export const TeamForm: React.FC<TeamFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teamToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useAppStore();

  useEffect(() => {
    if (teamToEdit) {
      setName(teamToEdit.name || '');
      setDescription(teamToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setError(null);
  }, [teamToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setLoading(true);
      if (teamToEdit) {
        await apiClient.patch(`/api/teams/${teamToEdit.id}`, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        addToast({
          type: 'success',
          message: `Team "${name}" updated successfully`,
        });
      } else {
        await apiClient.post('/api/teams', {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        addToast({
          type: 'success',
          message: `Team "${name}" created successfully`,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={teamToEdit ? 'Edit Security Team' : 'Create New Security Operations Team'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Team Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cloud Security Response (CSR)"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Description & Scope</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specialized in cloud posture, unauthorized IAM escalations and lateral movement"
            rows={3}
            className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : teamToEdit ? 'Save Changes' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TeamForm;
