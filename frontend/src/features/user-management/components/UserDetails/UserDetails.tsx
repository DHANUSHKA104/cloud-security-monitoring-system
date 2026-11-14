import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime } from '@/utils/formatters/dateFormatter';

interface UserSkillDto {
  skillId: string;
  skillName: string;
  level: number;
}

interface UserTeamDto {
  teamId: string;
  teamName: string;
  teamRole: string;
}

interface UserDetailResponse {
  id: string;
  email: string;
  fullName: string;
  department?: string;
  role: string;
  active: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  skills: UserSkillDto[];
  teams: UserTeamDto[];
}

interface UserDetailsProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEditSkills?: (userId: string, userName: string) => void;
  onUserUpdated?: () => void;
}

export const UserDetails: React.FC<UserDetailsProps> = ({
  userId,
  isOpen,
  onClose,
  onEditSkills,
  onUserUpdated,
}) => {
  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { addToast } = useAppStore();

  useEffect(() => {
    if (!isOpen || !userId) {
      setUser(null);
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<UserDetailResponse>(`/api/users/${userId}`);
        setUser(data);
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        setError(apiErr.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [isOpen, userId]);

  const handleToggleActive = async () => {
    if (!user) return;
    try {
      setActionLoading(true);
      await apiClient.patch(`/api/users/${user.id}`, { active: !user.active });
      addToast({
        type: 'success',
        message: `Account ${user.active ? 'deactivated' : 'activated'} successfully`,
      });
      setUser((prev) => (prev ? { ...prev, active: !prev.active } : null));
      onUserUpdated?.();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to toggle account status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-900/40 text-purple-300 border-purple-800';
      case 'ANALYST':
        return 'bg-blue-900/40 text-blue-300 border-blue-800';
      case 'VIEWER':
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Security Operator Profile" maxWidth="lg">
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading operator details...</div>
      ) : error ? (
        <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded text-rose-400 text-xs">
          {error}
        </div>
      ) : user ? (
        <div className="space-y-6">
          {/* Identity Header */}
          <div className="flex items-start justify-between p-4 bg-gray-900/60 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  {user.fullName}
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                      user.active
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950/40 text-rose-400 border-rose-800'
                    }`}
                  >
                    {user.active ? 'Active' : 'Deactivated'}
                  </span>
                </h3>
                <p className="text-xs text-gray-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Dept: {user.department || 'SOC Operations'}
                  </span>
                  {user.mfaEnabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-300 border border-emerald-800">
                      MFA Protected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant={user.active ? 'danger' : 'secondary'}
              size="sm"
              onClick={handleToggleActive}
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : user.active ? 'Deactivate Account' : 'Reactivate Account'}
            </Button>
          </div>

          {/* Assigned Security Teams */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Assigned Teams ({user.teams?.length || 0})
              </h4>
            </div>
            {user.teams && user.teams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {user.teams.map((t) => (
                  <div
                    key={t.teamId}
                    className="p-3 bg-gray-900/40 border border-gray-800/80 rounded-md flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-gray-200">{t.teamName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        t.teamRole === 'LEAD'
                          ? 'bg-amber-950/40 text-amber-300 border-amber-800'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}
                    >
                      {t.teamRole}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-900/20 border border-dashed border-gray-800 rounded text-center text-xs text-gray-500">
                Not assigned to any security teams yet.
              </div>
            )}
          </div>

          {/* Assigned Skills & Competency Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Skill Competencies ({user.skills?.length || 0})
              </h4>
              {onEditSkills && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditSkills(user.id, user.fullName)}
                >
                  Edit Skills
                </Button>
              )}
            </div>

            {user.skills && user.skills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {user.skills.map((s) => (
                  <div
                    key={s.skillId}
                    className="p-3 bg-gray-900/40 border border-gray-800/80 rounded-md space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-200">{s.skillName}</span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800">
                        Level {s.level}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.level === 3
                            ? 'bg-purple-500 w-full'
                            : s.level === 2
                            ? 'bg-blue-500 w-2/3'
                            : 'bg-emerald-500 w-1/3'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-900/20 border border-dashed border-gray-800 rounded text-center text-xs text-gray-500">
                No skill competencies catalogued for this analyst.
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <span>ID: {user.id}</span>
            <span>Registered: {formatDateTime(user.createdAt)}</span>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default UserDetails;
