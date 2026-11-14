import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { SkillEditor } from '../SkillEditor';
import { UserDetails } from '../UserDetails';
import { UserForm } from '../UserForm';
import { User } from '@/types';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

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

  // Modals
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [selectedUserIdForDetails, setSelectedUserIdForDetails] = useState<string | null>(null);
  const [selectedUserForSkills, setSelectedUserForSkills] = useState<{ id: string; name: string } | null>(null);

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

  const handleToggleActive = async (user: User) => {
    try {
      await apiClient.patch(`/api/users/${user.id}`, { active: !user.active });
      addToast({
        type: 'success',
        message: `User ${user.fullName} ${user.active ? 'deactivated' : 'activated'}`,
      });
      fetchUsers();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to update user status',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-900/30 text-purple-400 border-purple-800';
      case 'ANALYST':
        return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'VIEWER':
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="w-64">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or email..."
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrators</option>
            <option value="ANALYST">Security Analysts</option>
            <option value="VIEWER">Viewers</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(0);
            }}
            className="bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated</option>
          </select>
        </div>

        <Button
          onClick={() => {
            setUserToEdit(null);
            setUserFormOpen(true);
          }}
          size="sm"
        >
          + Register Operator
        </Button>
      </div>

      {/* Directory Table */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading operators...</div>
        ) : error ? (
          <div className="p-4 text-xs text-rose-400 bg-rose-950/20">{error}</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No operators found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/80 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">MFA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedUserIdForDetails(user.id)}
                          className="font-medium text-gray-100 hover:text-blue-400 text-left transition-colors"
                        >
                          {user.fullName}
                        </button>
                        <p className="text-[11px] text-gray-400 font-mono">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {user.department || 'SOC Operations'}
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUserIdForDetails(user.id)}
                          className="px-2 py-1 text-[11px] rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserToEdit(user);
                            setUserFormOpen(true);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-700 transition-colors"
                        >
                          Edit
                        </button>
                        {user.role === 'ANALYST' && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUserForSkills({ id: user.id, name: user.fullName })
                            }
                            className="px-2 py-1 text-[11px] rounded bg-gray-800 hover:bg-gray-700 text-sky-400 border border-gray-700 transition-colors"
                          >
                            Skills
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
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

      {/* Operator Details Modal */}
      <UserDetails
        userId={selectedUserIdForDetails}
        isOpen={!!selectedUserIdForDetails}
        onClose={() => setSelectedUserIdForDetails(null)}
        onEditSkills={(uId, uName) => {
          setSelectedUserIdForDetails(null);
          setSelectedUserForSkills({ id: uId, name: uName });
        }}
        onUserUpdated={fetchUsers}
      />

      {/* Operator Create / Edit Form Modal */}
      <UserForm
        isOpen={userFormOpen}
        onClose={() => {
          setUserFormOpen(false);
          setUserToEdit(null);
        }}
        onSuccess={fetchUsers}
        userToEdit={userToEdit}
      />

      {/* Skill Editor Modal */}
      <SkillEditor
        userId={selectedUserForSkills?.id || null}
        userName={selectedUserForSkills?.name || ''}
        isOpen={!!selectedUserForSkills}
        onClose={() => setSelectedUserForSkills(null)}
        onSaved={fetchUsers}
      />
    </div>
  );
};

export default UserList;
