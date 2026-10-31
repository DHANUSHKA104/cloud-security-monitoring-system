import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface TeamFormData {
  name: string;
  description?: string;
}

export interface TeamFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    name?: string;
    description?: string;
  } | null;
  onSubmit: (data: TeamFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export const TeamForm: React.FC<TeamFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
      setValidationError('Team name must be between 2 and 80 characters');
      return;
    }

    if (description && description.length > 255) {
      setValidationError('Description cannot exceed 255 characters');
      return;
    }

    await onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
    });
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="team-form">
      {displayError && (
        <div
          role="alert"
          className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md"
        >
          {displayError}
        </div>
      )}

      <Input
        id="team-form-name"
        label="Team Name"
        placeholder="Cloud Incident Response Squad"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div>
        <label htmlFor="team-form-desc" className="block text-xs font-medium text-gray-300 mb-1">
          Description / Mission
        </label>
        <textarea
          id="team-form-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Primary response squad for AWS and Kubernetes infrastructure events..."
          className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {mode === 'create' ? 'Create Team' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default TeamForm;
