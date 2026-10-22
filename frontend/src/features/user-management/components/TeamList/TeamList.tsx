import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  teamRole: 'LEAD' | 'MEMBER';
}

interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface PageResponse<T> {
  content: T[];
}

export const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected team & members view
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Create Team modal
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Add Member modal
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  const { addToast } = useAppStore();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<Team[]>('/api/teams');
      setTeams(res || []);
      if (res && res.length > 0 && !selectedTeam) {
        setSelectedTeam(res[0]);
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    fetchTeams();
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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      setCreateLoading(true);
      const created = await apiClient.post<Team>('/api/teams', {
        name: teamName.trim(),
        description: teamDesc.trim() || undefined,
      });

      addToast({
        type: 'success',
        message: `Team "${created.name}" created`,
      });
      setCreateTeamOpen(false);
      setTeamName('');
      setTeamDesc('');
      setSelectedTeam(created);
      fetchTeams();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to create team',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const openAddMemberModal = async () => {
    try {
      setAddMemberOpen(true);
      const res = await apiClient.get<PageResponse<UserSummary>>('/api/users?size=100');
      const usersList = res.content || [];
      setAllUsers(usersList);
      if (usersList.length > 0) {
        setSelectedUserId(usersList[0].id);
      }
    } catch {
      // Fallback
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

      addToast({
        type: 'success',
        message: 'Member added to team',
      });
      setAddMemberOpen(false);

      // Refresh members
      const updated = await apiClient.get<TeamMember[]>(`/api/teams/${selectedTeam.id}/members`);
      setMembers(updated || []);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to assign team member',
      });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!selectedTeam) return;
    try {
      await apiClient.delete(`/api/teams/${selectedTeam.id}/members/${userId}`);
      addToast({
        type: 'success',
        message: `Removed ${name} from ${selectedTeam.name}`,
      });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to remove member',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-gray-900/60 p-3 rounded-lg border border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Security Operations Teams</h2>
          <p className="text-xs text-gray-400">
            Define specialized SOC response squads and designate squad leads
          </p>
        </div>
        <Button onClick={() => setCreateTeamOpen(true)} size="sm">
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
                  onClick={() => setSelectedTeam(t)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTeam?.id === t.id
                      ? 'bg-blue-950/40 border-blue-600 text-blue-100 shadow-sm'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div className="font-medium text-xs text-gray-100">{t.name}</div>
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
                  <Button onClick={openAddMemberModal} size="sm" variant="secondary">
                    + Add Member
                  </Button>
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
                          <th className="py-2 px-3 font-medium text-right">Action</th>
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
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.userId, m.fullName)}
                                className="text-rose-400 hover:text-rose-300 text-[11px] font-medium"
                              >
                                Remove
                              </button>
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

      {/* Create Team Modal */}
      <Modal
        open={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        title="Form New Security Team"
      >
        <div className="text-xs text-gray-400 mb-3">
          Create a functional security operations unit (e.g., Cloud SOC, Threat Intel, Blue Team).
        </div>
        <form onSubmit={handleCreateTeam} className="space-y-3">
          <Input
            id="team-name"
            label="Team Name"
            placeholder="Cloud Incident Response Squad"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />

          <div>
            <label htmlFor="team-desc" className="block text-xs font-medium text-gray-300 mb-1">
              Description / Responsibilities
            </label>
            <textarea
              id="team-desc"
              rows={3}
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="Primary responders for AWS/Azure cloud security events..."
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateTeamOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createLoading}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title={`Add Member to ${selectedTeam?.name || ''}`}
      >
        <div className="text-xs text-gray-400 mb-3">
          Select an analyst and designate their squad responsibility.
        </div>
        <form onSubmit={handleAddMember} className="space-y-3">
          <div>
            <label htmlFor="select-user" className="block text-xs font-medium text-gray-300 mb-1">
              Select Operator
            </label>
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
            <Button type="submit" variant="primary" loading={addingMember}>
              Assign Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TeamList;
