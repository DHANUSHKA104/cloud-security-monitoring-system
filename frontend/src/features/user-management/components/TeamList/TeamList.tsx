import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { TeamForm } from '../TeamForm';

interface Team {
  id: string;
  name: string;
  description?: string;
  leadId?: string;
  leadName?: string;
  memberCount?: number;
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

  // Team Form Modal (Create & Edit)
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);

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
      if (res && res.length > 0) {
        setSelectedTeam((curr) => {
          if (!curr) return res[0];
          const found = res.find((t) => t.id === curr.id);
          return found || res[0];
        });
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

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
      await apiClient.post(`/api/teams/${selectedTeam.id}/members`, {
        userId: selectedUserId,
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
      fetchTeams();
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
      fetchTeams();
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
        <Button
          onClick={() => {
            setTeamToEdit(null);
            setTeamFormOpen(true);
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
                  onClick={() => setSelectedTeam(t)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTeam?.id === t.id
                      ? 'bg-blue-950/40 border-blue-600 text-blue-100 shadow-sm'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-gray-100">{t.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {t.memberCount || 0} mbrs
                    </span>
                  </div>
                  {t.leadName && (
                    <div className="text-[11px] text-amber-400/90 mt-1">
                      Lead: {t.leadName}
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
                    <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                      {selectedTeam.name}
                      <span className="text-xs font-normal text-gray-400">
                        ({members.length} operators)
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedTeam.description || 'No description provided.'}
                    </p>
                    {selectedTeam.leadName && (
                      <p className="text-xs text-amber-400/90 mt-1">
                        Squad Leads: {selectedTeam.leadName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setTeamToEdit(selectedTeam);
                        setTeamFormOpen(true);
                      }}
                      size="sm"
                      variant="secondary"
                    >
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
                    No analysts assigned to this team yet. Click &quot;+ Add Member&quot; to assign operators.
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
              <div className="py-16 text-center text-xs text-gray-400">
                Select a team on the left to inspect squad members.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Form Modal (Create and Edit) */}
      <TeamForm
        isOpen={teamFormOpen}
        onClose={() => {
          setTeamFormOpen(false);
          setTeamToEdit(null);
        }}
        onSuccess={fetchTeams}
        teamToEdit={teamToEdit}
      />

      {/* Add Member Modal */}
      <Modal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title={`Assign Member to ${selectedTeam?.name || 'Team'}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Select Operator</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              required
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email}) — {u.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Squad Role</label>
            <select
              value={selectedMemberRole}
              onChange={(e) => setSelectedMemberRole(e.target.value as 'LEAD' | 'MEMBER')}
              className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="MEMBER">MEMBER (Standard Squad Operator)</option>
              <option value="LEAD">LEAD (Squad Lead / Escalation Point)</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Teams can have multiple Leads. Assigning a new Lead will not demote existing leads.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setAddMemberOpen(false)}
              disabled={addingMember}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addingMember || !selectedUserId}>
              {addingMember ? 'Assigning...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamList;
