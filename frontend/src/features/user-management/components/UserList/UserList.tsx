import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { UserForm, UserFormData } from '../UserForm';
import { UserDetails } from '../UserDetails';
import { SkillEditor } from '../SkillEditor';
import { User, PageResponse } from '@/types';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit User Modal
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Skill Editor Modal
  const [selectedUserForSkills, setSelectedUserForSkills] = useState<{ id: string; name: string } | null>(null);

  // User Details Modal
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);

  const { addToast } = useAppStore();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '10');
      if (search.trim()) params.append('q', search.trim());
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (activeFilter === 'ACTIVE') params.append('active', 'true');
      if (activeFilter === 'INACTIVE') params.append('active', 'false');

      const res = await apiClient.get<PageResponse<User>>(`/api/users?${params.toString()}`);
      setUsers(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, activeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Deactivation (with confirmation) ──────────────────────────────────────

  const openDeactivateConfirm = (user: User) => {
    setDeactivateTarget(user);
  };

  const handleToggleActive = async (user: User, activate: boolean) => {
    try {
      setDeactivateLoading(true);
      await apiClient.patch(`/api/users/${user.id}`, { active: activate });
      addToast({
        type: 'success',
        message: `User ${user.fullName} ${activate ? 'activated' : 'deactivated'}`,
      });
      setDeactivateTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to update user status',
      });
    } finally {
      setDeactivateLoading(false);
    }
  };

  // ── Create User ────────────────────────────────────────────────────────────

  const handleCreateUser = async (formData: UserFormData) => {
    try {
      setCreateLoading(true);
      setCreateError(null);
      await apiClient.post('/api/users', formData);
      addToast({
        type: 'success',
        message: `Account created for ${formData.fullName}`,
      });
      setCreateModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setCreateError(apiErr.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit User ──────────────────────────────────────────────────────────────

  const openEdit = (user: User) => {
    setEditTarget(user);
    setEditError(null);
  };

  const handleEditUser = async (formData: UserFormData) => {
    if (!editTarget) return;
    try {
      setEditLoading(true);
      setEditError(null);
      await apiClient.patch(`/api/users/${editTarget.id}`, {
        fullName: formData.fullName,
        department: formData.department,
        role: formData.role,
        active: formData.active,
      });
      addToast({ type: 'success', message: `Profile updated for ${formData.fullName}` });
      setEditTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setEditError(apiErr.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="user-management-section">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full sm:w-64 bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="ANALYST">ANALYST</option>
            <option value="VIEWER">VIEWER</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(0);
            }}
            className="bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>

        <Button
          onClick={() => {
            setCreateError(null);
            setCreateModalOpen(true);
          }}
          size="sm"
        >
          + Add User
        </Button>
      </div>

      {/* Main Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {error && (
          <div className="p-4 bg-red-950/60 border-b border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">Loading user records...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500">
            No users match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/50 text-gray-400">
                  <th className="py-3 px-4 font-medium">User Details</th>
                  <th className="py-3 px-4 font-medium">Department</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">MFA</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        className="text-left group"
                        onClick={() => setSelectedUserForDetails(user)}
                        title="Click to view detailed user profile"
                      >
                        <div className="font-medium text-gray-100 group-hover:text-blue-400 transition-colors">
                          {user.fullName}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">{user.email}</div>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{user.department || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] uppercase border ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                            : user.role === 'ANALYST'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                            : 'bg-gray-800 text-gray-300 border-gray-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          user.mfaEnabled
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {user.mfaEnabled ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          user.active ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.active ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {user.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Skills button — available for all user roles */}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserForSkills({ id: user.id, name: user.fullName })
                          }
                          className="px-2 py-1 text-[11px] rounded bg-gray-800 hover:bg-gray-700 text-sky-400 border border-gray-700 transition-colors"
                        >
                          Skills
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="px-2 py-1 text-[11px] rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            user.active
                              ? openDeactivateConfirm(user)
                              : handleToggleActive(user, true)
                          }
                          className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                            user.active
                              ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/60'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                          }`}
                        >
                          {user.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-3 border-t border-gray-800 text-xs text-gray-400 bg-gray-950/40">
          <span>
            Showing {users.length} of {totalElements} users
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2.5 py-1 rounded border border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded border border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create User Modal — renders UserForm */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register Team Member"
      >
        <div className="text-xs text-gray-400 mb-3">
          Add a new security operator, administrator or observer to the platform.
        </div>
        <UserForm
          mode="create"
          onSubmit={handleCreateUser}
          onCancel={() => setCreateModalOpen(false)}
          loading={createLoading}
          error={createError}
        />
      </Modal>

      {/* Edit User Modal — renders UserForm */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit Profile — ${editTarget?.fullName || ''}`}
      >
        {editTarget && (
          <UserForm
            mode="edit"
            initialData={editTarget}
            onSubmit={handleEditUser}
            onCancel={() => setEditTarget(null)}
            loading={editLoading}
            error={editError}
          />
        )}
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Confirm Deactivation"
      >
        {deactivateTarget && (
          <div className="space-y-4">
            <p className="text-xs text-gray-300">
              Are you sure you want to deactivate{' '}
              <span className="font-semibold text-gray-100">{deactivateTarget.fullName}</span>?
            </p>
            <p className="text-xs text-amber-400">
              Their active refresh tokens will be revoked immediately, preventing further login.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setDeactivateTarget(null)}
                disabled={deactivateLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleToggleActive(deactivateTarget, false)}
                loading={deactivateLoading}
              >
                Deactivate User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Skill Editor Modal */}
      {selectedUserForSkills && (
        <SkillEditor
          isOpen={!!selectedUserForSkills}
          userId={selectedUserForSkills.id}
          userName={selectedUserForSkills.name}
          onClose={() => setSelectedUserForSkills(null)}
          onSaved={() => fetchUsers()}
        />
      )}

      {/* User Details Profile Modal */}
      {selectedUserForDetails && (
        <UserDetails
          isOpen={!!selectedUserForDetails}
          user={selectedUserForDetails}
          onClose={() => setSelectedUserForDetails(null)}
          onOpenSkills={(uid, name) => {
            setSelectedUserForDetails(null);
            setSelectedUserForSkills({ id: uid, name });
          }}
        />
      )}
    </div>
  );
};

export default UserList;
