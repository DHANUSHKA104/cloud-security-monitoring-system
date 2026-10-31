import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api/apiClient';
import { User } from '@/types';

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

interface UserDetailData extends User {
  skills: UserSkillDto[];
  teams: UserTeamDto[];
}

interface UserDetailsProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onOpenSkills?: (userId: string, userName: string) => void;
}

const levelLabel = (level: number) => {
  switch (level) {
    case 1:
      return 'L1 — Junior Associate';
    case 2:
      return 'L2 — Intermediate Analyst';
    case 3:
      return 'L3 — Senior SOC Specialist';
    default:
      return 'Unrated';
  }
};

const levelColor = (level: number) => {
  switch (level) {
    case 1:
      return 'text-blue-300 bg-blue-950/60 border-blue-800';
    case 2:
      return 'text-amber-300 bg-amber-950/60 border-amber-800';
    case 3:
      return 'text-emerald-300 bg-emerald-950/60 border-emerald-800';
    default:
      return 'text-gray-400 bg-gray-800 border-gray-700';
  }
};

export const UserDetails: React.FC<UserDetailsProps> = ({
  isOpen,
  user,
  onClose,
  onOpenSkills,
}) => {
  const [detail, setDetail] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<UserDetailData>(`/api/users/${user.id}`);
        setDetail(res);
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        setError(apiErr.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, user]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Profile — ${user.fullName}`}
      maxWidth="lg"
    >
      {loading ? (
        <div className="py-10 text-center text-xs text-gray-400">Loading profile...</div>
      ) : error ? (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
          {error}
        </div>
      ) : detail ? (
        <div className="space-y-5" data-testid="user-details-modal">
          {/* Core info grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-950 border border-gray-800 rounded p-3">
              <p className="text-gray-500 mb-1">Full Name</p>
              <p className="text-gray-100 font-medium">{detail.fullName}</p>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded p-3">
              <p className="text-gray-500 mb-1">Email</p>
              <p className="text-gray-100 font-mono text-[11px]">{detail.email}</p>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded p-3">
              <p className="text-gray-500 mb-1">Department</p>
              <p className="text-gray-100">{detail.department || '—'}</p>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded p-3">
              <p className="text-gray-500 mb-1">Role</p>
              <span
                className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] uppercase border ${
                  detail.role === 'ADMIN'
                    ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                    : detail.role === 'ANALYST'
                    ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                    : 'bg-gray-800 text-gray-300 border-gray-700'
                }`}
              >
                {detail.role}
              </span>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded p-3">
              <p className="text-gray-500 mb-1">Account Status</p>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                  detail.active ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    detail.active ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                {detail.active ? 'Active' : 'Deactivated'}
              </span>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded p-3">
              <p className="text-gray-500 mb-1">MFA</p>
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  detail.mfaEnabled
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {detail.mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {detail.createdAt && (
              <div className="bg-gray-950 border border-gray-800 rounded p-3">
                <p className="text-gray-500 mb-1">Registered On</p>
                <p className="text-gray-300 text-[11px]">
                  {new Date(detail.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {detail.updatedAt && (
              <div className="bg-gray-950 border border-gray-800 rounded p-3">
                <p className="text-gray-500 mb-1">Last Updated</p>
                <p className="text-gray-300 text-[11px]">
                  {new Date(detail.updatedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Skill Competencies ({detail.skills.length})
              </h4>
              {onOpenSkills && (
                <button
                  type="button"
                  onClick={() => onOpenSkills(detail.id, detail.fullName)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  Edit Skills →
                </button>
              )}
            </div>
            {detail.skills.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No skills assigned yet.</p>
            ) : (
              <div className="space-y-1.5">
                {detail.skills.map((s) => (
                  <div
                    key={s.skillId}
                    className="flex items-center justify-between p-2 bg-gray-950 border border-gray-800 rounded text-xs"
                  >
                    <span className="text-gray-200">{s.skillName}</span>
                    <span
                      className={`px-2 py-0.5 rounded border font-mono text-[10px] ${levelColor(
                        s.level
                      )}`}
                    >
                      {s.level > 0 ? `L${s.level}` : 'None'} — {levelLabel(s.level)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teams */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Team Memberships ({detail.teams.length})
            </h4>
            {detail.teams.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">Not assigned to any team.</p>
            ) : (
              <div className="space-y-1.5">
                {detail.teams.map((t) => (
                  <div
                    key={t.teamId}
                    className="flex items-center justify-between p-2 bg-gray-950 border border-gray-800 rounded text-xs"
                  >
                    <span className="text-gray-200">{t.teamName}</span>
                    <span
                      className={`px-2 py-0.5 rounded border font-mono text-[10px] ${
                        t.teamRole === 'LEAD'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800 font-bold'
                          : 'bg-gray-800 text-gray-300 border-gray-700'
                      }`}
                    >
                      {t.teamRole}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-800">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default UserDetails;
