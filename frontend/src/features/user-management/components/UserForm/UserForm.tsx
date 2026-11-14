import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { User, Role } from '@/types';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: User | null;
}

export const UserForm: React.FC<UserFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('SOC Operations');
  const [role, setRole] = useState<Role>('ANALYST');
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useAppStore();

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.fullName || '');
      setEmail(userToEdit.email || '');
      setPassword('');
      setDepartment(userToEdit.department || 'SOC Operations');
      setRole(userToEdit.role || 'ANALYST');
      setActive(userToEdit.active ?? true);
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setDepartment('SOC Operations');
      setRole('ANALYST');
      setActive(true);
    }
    setError(null);
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!userToEdit) {
      if (!email.trim() || !email.includes('@')) {
        setError('Valid email address is required');
        return;
      }
      if (password.length < 10) {
        setError('Password must be at least 10 characters');
        return;
      }
      if (password.toLowerCase() === email.toLowerCase()) {
        setError('Password must be different from email');
        return;
      }
    }

    try {
      setLoading(true);
      if (userToEdit) {
        await apiClient.patch(`/api/users/${userToEdit.id}`, {
          fullName: fullName.trim(),
          department: department.trim() || undefined,
          role,
          active,
        });
        addToast({
          type: 'success',
          message: `User ${fullName} updated successfully`,
        });
      } else {
        await apiClient.post('/api/users', {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          department: department.trim() || undefined,
          role,
        });
        addToast({
          type: 'success',
          message: `User ${fullName} created successfully`,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to save operator details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={userToEdit ? 'Edit Operator Profile' : 'Register New Security Operator'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Alice Chen"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. alice@cloudsec.local"
            disabled={!!userToEdit}
            required={!userToEdit}
          />
          {userToEdit && (
            <p className="text-[10px] text-gray-500 mt-0.5">Email address cannot be changed.</p>
          )}
        </div>

        {!userToEdit && (
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Initial Password (min 10 chars)
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Department</label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="SOC Operations"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Access Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ANALYST">ANALYST (SOC Operator)</option>
              <option value="ADMIN">ADMIN (SOC Supervisor)</option>
              <option value="VIEWER">VIEWER (Read-Only)</option>
            </select>
          </div>
        </div>

        {userToEdit && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
            <input
              type="checkbox"
              id="activeToggle"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded bg-gray-950 border-gray-800 text-blue-600 focus:ring-0"
            />
            <label htmlFor="activeToggle" className="text-xs text-gray-300 font-medium">
              Account Active (enabled for shift scheduling & incident routing)
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : userToEdit ? 'Save Changes' : 'Create Operator'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;
