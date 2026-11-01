import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { TeamForm, TeamFormData } from '../TeamForm';
import { Team, TeamMember, Role } from '@/types';

interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
}

interface PageResponse<T> {
  content: T[];
}

export const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected team & members view
  // Use a ref to track the selected team ID without causing fetchTeams re-runs.
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Create Team modal
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Team modal
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add Member modal
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  // Change role modal
  const [changeRoleTarget, setChangeRoleTarget] = useState<TeamMember | null>(null);
  const [changeRoleValue, setChangeRoleValue] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  const [changingRole, setChangingRole] = useState(false);

  // Confirm remove modal
  const [removeMemberTarget, setRemoveMemberTarget] = useState<TeamMember | null>(null);

  const { addToast } = useAppStore();

  // FIX: fetchTeams no longer depends on selectedTeam so it won't re-run every
  // time the selected team changes (which caused an infinite request loop).
  const fetchTeams = useCallback(async (autoSelectFirst = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<Team[]>('/api/teams');
      const list = res || [];
      setTeams(list);
      if (autoSelectFirst && list.length > 0 && !selectedTeamIdRef.current) {
        selectedTeamIdRef.current = list[0].id;
        setSelectedTeam(list[0]);
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run only once on mount
  useEffect(() => {
    fetchTeams(true);
  }, [fetchTeams]);

  // Fetch members when selectedTeam changes
  useEffect(() => {
    if (!selectedTeam) {
      setMembers([]);
      return;
    }
    const loadMembers = async () => {
      try {
        setLoadingMembers(true);
        const res = await apiClient.get<TeamMember[]>(`/api/teams/${selectedTeam.id}/members`);
        setMembers(res || []);
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        addToast({
          type: 'error',
          message: apiErr.message || 'Failed to load team members',
        });
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [selectedTeam, addToast]);

  const handleSelectTeam = (t: Team) => {
    selectedTeamIdRef.current = t.id;
    setSelectedTeam(t);
  };

  const refreshMembers = async (teamId: string) => {
    try {
      const updated = await apiClient.get<TeamMember[]>(`/api/teams/${teamId}/members`);
      setMembers(updated || []);
    } catch {
      // non-critical
    }
  };

  const handleCreateTeam = async (formData: TeamFormData) => {
    try {
      setCreateLoading(true);
      setCreateError(null);
      const created = await apiClient.post<Team>('/api/teams', formData);

      addToast({ type: 'success', message: `Team "${created.name}" created` });
      setCreateTeamOpen(false);
      selectedTeamIdRef.current = created.id;
      setSelectedTeam(created);
      fetchTeams();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setCreateError(apiErr.message || 'Failed to create team');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditTeam = () => {
    if (!selectedTeam) return;
    setEditError(null);
    setEditTeamOpen(true);
  };

  const handleEditTeam = async (formData: TeamFormData) => {
    if (!selectedTeam) return;
    try {
      setEditLoading(true);
      setEditError(null);
      const updated = await apiClient.patch<Team>(`/api/teams/${selectedTeam.id}`, formData);
      addToast({ type: 'success', message: `Team "${updated.name}" updated` });
      setEditTeamOpen(false);
      selectedTeamIdRef.current = updated.id;
      setSelectedTeam(updated);
      fetchTeams();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setEditError(apiErr.message || 'Failed to update team');
    } finally {
      setEditLoading(false);
    }
  };

  const openAddMemberModal = async () => {
    try {
      setAddMemberOpen(true);
      // Exclude inactive users by querying active=true
      const res = await apiClient.get<PageResponse<UserSummary>>('/api/users?size=200&active=true');
      const usersList = res.content || [];
      // Also filter out users already on the team to prevent duplicate membership attempts
      const currentMemberIds = new Set(members.map((m) => m.userId));
      const eligibleUsers = usersList.filter((u) => !currentMemberIds.has(u.id));
      setAllUsers(eligibleUsers);
      if (eligibleUsers.length > 0) {
        setSelectedUserId(eligibleUsers[0].id);
      } else {
        setSelectedUserId('');
      }
    } catch {
      setAllUsers([]);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedUserId) return;

    try {
      setAddingMember(true);
      await apiClient.put(`/api/teams/${selectedTeam.id}/members/${selectedUserId}`, {
        teamRole: selectedMemberRole,
      });

      addToast({ type: 'success', message: 'Member added to team' });
      setAddMemberOpen(false);
      await refreshMembers(selectedTeam.id);
      fetchTeams();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({ type: 'error', message: apiErr.message || 'Failed to assign team member' });
    } finally {
      setAddingMember(false);
    }
  };

  const openChangeRole = (member: TeamMember) => {
    setChangeRoleTarget(member);
    setChangeRoleValue(member.teamRole === 'LEAD' ? 'MEMBER' : 'LEAD');
  };

  const handleChangeRole = async () => {
    if (!selectedTeam || !changeRoleTarget) return;
    try {
      setChangingRole(true);
      await apiClient.put(`/api/teams/${selectedTeam.id}/members/${changeRoleTarget.userId}`, {
        teamRole: changeRoleValue,
      });
      addToast({
        type: 'success',
        message: `${changeRoleTarget.fullName} is now ${changeRoleValue}`,
      });
      setChangeRoleTarget(null);
      await refreshMembers(selectedTeam.id);
      fetchTeams();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({ type: 'error', message: apiErr.message || 'Failed to change role' });
    } finally {
      setChangingRole(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!selectedTeam || !removeMemberTarget) return;
    const { userId, fullName } = removeMemberTarget;
    setRemoveMemberTarget(null);
    try {
      await apiClient.delete(`/api/teams/${selectedTeam.id}/members/${userId}`);
      addToast({ type: 'success', message: `Removed ${fullName} from ${selectedTeam.name}` });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      fetchTeams();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({ type: 'error', message: apiErr.message || 'Failed to remove member' });
    }
  };

  return (
    <div className="space-y-4" data-testid="team-management-section">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-gray-900/60 p-3 rounded-lg border border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Security Operations Teams</h2>
          <p className="text-xs text-gray-400">
            Define specialized SOC response squads and designate squad leads
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateError(null);
            setCreateTeamOpen(true);
          }}
          size="sm"
        >
          + New Team
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400">Loading squads...</div>
      ) : teams.length === 0 ? (
        <div className="py-16 text-center text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-lg">
          No teams established yet. Click &quot;+ New Team&quot; to form one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Teams list column */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              Teams ({teams.length})
            </h3>
            <div className="space-y-1.5">
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTeam(t)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTeam?.id === t.id
                      ? 'bg-blue-950/40 border-blue-600 text-blue-100 shadow-sm'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div className="font-medium text-xs text-gray-100">{t.name}</div>
                  {t.leadName && (
                    <div className="text-[11px] text-amber-400 mt-0.5">
                      Squad Lead: {t.leadName}
                    </div>
                  )}
                  {t.description && (
                    <div className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                      {t.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Members column */}
          <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
            {selectedTeam ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-100">
                      {selectedTeam.name} — Members
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedTeam.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={openEditTeam} size="sm" variant="secondary">
                      Edit Team
                    </Button>
                    <Button onClick={openAddMemberModal} size="sm" variant="secondary">
                      + Add Member
                    </Button>
                  </div>
                </div>

                {loadingMembers ? (
                  <div className="py-12 text-center text-xs text-gray-400">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500">
                    No analysts assigned to this team yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400">
                          <th className="py-2 px-3 font-medium">Analyst</th>
                          <th className="py-2 px-3 font-medium">Role in Team</th>
                          <th className="py-2 px-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {members.map((m) => (
                          <tr key={m.userId} className="hover:bg-gray-800/30">
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-gray-100">{m.fullName}</div>
                              <div className="text-[11px] text-gray-400 font-mono">{m.email}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${
                                  m.teamRole === 'LEAD'
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-800 font-bold'
                                    : 'bg-gray-800 text-gray-300 border-gray-700'
                                }`}
                              >
                                {m.teamRole}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openChangeRole(m)}
                                  className="text-sky-400 hover:text-sky-300 text-[11px] font-medium"
                                >
                                  {m.teamRole === 'LEAD' ? 'Demote to Member' : 'Promote to Lead'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRemoveMemberTarget(m)}
                                  className="text-rose-400 hover:text-rose-300 text-[11px] font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-xs text-gray-500">
                Select a team on the left to review members.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Team Modal — renders TeamForm */}
      <Modal
        open={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        title="Form New Security Team"
      >
        <div className="text-xs text-gray-400 mb-3">
          Create a functional security operations unit (e.g., Cloud SOC, Threat Intel, Blue Team).
        </div>
        <TeamForm
          mode="create"
          onSubmit={handleCreateTeam}
          onCancel={() => setCreateTeamOpen(false)}
          loading={createLoading}
          error={createError}
        />
      </Modal>

      {/* Edit Team Modal — renders TeamForm */}
      <Modal
        open={editTeamOpen}
        onClose={() => setEditTeamOpen(false)}
        title={`Edit Team: ${selectedTeam?.name || ''}`}
      >
        {selectedTeam && (
          <TeamForm
            mode="edit"
            initialData={selectedTeam}
            onSubmit={handleEditTeam}
            onCancel={() => setEditTeamOpen(false)}
            loading={editLoading}
            error={editError}
          />
        )}
      </Modal>

      {/* Add Member Modal */}
      <Modal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title={`Add Member to ${selectedTeam?.name || ''}`}
      >
        <div className="text-xs text-gray-400 mb-3">
          Select an active analyst and designate their squad responsibility.
        </div>
        <form onSubmit={handleAddMember} className="space-y-3">
          <div>
            <label htmlFor="select-user" className="block text-xs font-medium text-gray-300 mb-1">
              Select Operator
            </label>
            {allUsers.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">
                No eligible active operators available to add.
              </p>
            ) : (
              <select
                id="select-user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email}) — {u.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="select-team-role" className="block text-xs font-medium text-gray-300 mb-1">
              Squad Role
            </label>
            <select
              id="select-team-role"
              value={selectedMemberRole}
              onChange={(e) => setSelectedMemberRole(e.target.value as 'LEAD' | 'MEMBER')}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="MEMBER">MEMBER</option>
              <option value="LEAD">LEAD (Shift Escalation Target)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddMemberOpen(false)}
              disabled={addingMember}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={addingMember}
              disabled={!selectedUserId}
            >
              Assign Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Role Confirmation Modal */}
      <Modal
        open={!!changeRoleTarget}
        onClose={() => setChangeRoleTarget(null)}
        title="Change Team Role"
      >
        {changeRoleTarget && (
          <div className="space-y-4">
            <p className="text-xs text-gray-300">
              Change <span className="font-semibold text-gray-100">{changeRoleTarget.fullName}</span>&apos;s role
              from <span className="font-mono text-amber-300">{changeRoleTarget.teamRole}</span> to:
            </p>
            <select
              value={changeRoleValue}
              onChange={(e) => setChangeRoleValue(e.target.value as 'LEAD' | 'MEMBER')}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="MEMBER">MEMBER</option>
              <option value="LEAD">LEAD (Shift Escalation Target)</option>
            </select>
            {changeRoleValue === 'LEAD' && (
              <div className="p-2 bg-amber-950/40 border border-amber-800 rounded text-[11px] text-amber-300">
                Promoting to LEAD will automatically demote the existing squad lead to MEMBER.
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setChangeRoleTarget(null)}
                disabled={changingRole}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleChangeRole} loading={changingRole}>
                Confirm Change
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Member Confirmation Modal */}
      <Modal
        open={!!removeMemberTarget}
        onClose={() => setRemoveMemberTarget(null)}
        title="Remove Team Member"
      >
        {removeMemberTarget && (
          <div className="space-y-4">
            <p className="text-xs text-gray-300">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-gray-100">{removeMemberTarget.fullName}</span> from{' '}
              <span className="font-semibold text-gray-100">{selectedTeam?.name}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <Button variant="secondary" onClick={() => setRemoveMemberTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmRemove}>
                Remove Member
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeamList;
