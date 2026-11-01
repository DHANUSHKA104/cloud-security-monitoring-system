import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Role, User } from '@/types';

export interface UserFormData {
  fullName: string;
  email?: string;
  password?: string;
  department?: string;
  role: Role;
  active?: boolean;
}

export interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: User | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export const UserForm: React.FC<UserFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState(initialData?.department || 'SOC Operations');
  const [role, setRole] = useState<Role>(initialData?.role || 'ANALYST');
  const [active, setActive] = useState<boolean>(initialData?.active ?? true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || '');
      setEmail(initialData.email || '');
      setDepartment(initialData.department || 'SOC Operations');
      setRole(initialData.role || 'ANALYST');
      setActive(initialData.active ?? true);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setValidationError('Full name must be at least 2 characters');
      return;
    }

    if (mode === 'create') {
      if (!email.trim()) {
        setValidationError('Email is required');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setValidationError('Enter a valid email address');
        return;
      }
      if (!password || password.length < 10) {
        setValidationError('Password must be at least 10 characters');
        return;
      }
      if (password.toLowerCase() === email.trim().toLowerCase()) {
        setValidationError('Password cannot match the email address');
        return;
      }

      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        department: department.trim() || undefined,
        role,
      });
    } else {
      // Edit mode: never submit or expose password
      await onSubmit({
        fullName: fullName.trim(),
        department: department.trim() || undefined,
        role,
        active,
      });
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="user-form">
      {displayError && (
        <div
          role="alert"
          className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md"
        >
          {displayError}
        </div>
      )}

      <Input
        id="user-form-fullname"
        label="Full Name"
        placeholder="Jane Doe"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      {mode === 'create' && (
        <>
          <Input
            id="user-form-email"
            label="Email Address"
            type="email"
            placeholder="operator@cloudsec.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="user-form-password"
            label="Temporary Password"
            type="password"
            placeholder="Minimum 10 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </>
      )}

      {mode === 'edit' && (
        <div className="bg-gray-950 border border-gray-800 rounded p-2.5 text-xs">
          <span className="text-gray-400 block mb-0.5">Email (Read Only)</span>
          <span className="text-gray-200 font-mono text-[11px]">{email}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="user-form-dept" className="block text-xs font-medium text-gray-300 mb-1">
            Department
          </label>
          <input
            id="user-form-dept"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="user-form-role" className="block text-xs font-medium text-gray-300 mb-1">
            Assigned Role
          </label>
          <select
            id="user-form-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="ANALYST">ANALYST</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="user-form-active" className="block text-xs font-medium text-gray-300 mb-1">
            Account Status
          </label>
          <select
            id="user-form-active"
            value={active ? 'true' : 'false'}
            onChange={(e) => setActive(e.target.value === 'true')}
            className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
          {!active && (
            <p className="text-[11px] text-amber-400 mt-1">
              Deactivating this user will revoke all active refresh tokens.
            </p>
          )}
        </div>
      )}

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
          {mode === 'create' ? 'Create Account' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
