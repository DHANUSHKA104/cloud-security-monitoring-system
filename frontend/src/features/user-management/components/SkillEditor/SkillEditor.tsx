import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';

interface Skill {
  id: string;
  name: string;
}

interface UserSkillAssignment {
  skillId: string;
  skillName?: string;
  level: number;
}

interface UserDetail {
  id: string;
  fullName: string;
  skills: UserSkillAssignment[];
}

interface SkillEditorProps {
  userId: string | null;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const SkillEditor: React.FC<SkillEditorProps> = ({
  userId,
  userName,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [userSkillLevels, setUserSkillLevels] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useAppStore();

  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch skills list and user details in parallel
        const [skillsRes, userRes] = await Promise.all([
          apiClient.get<Skill[]>('/api/skills'),
          apiClient.get<UserDetail>(`/api/users/${userId}`),
        ]);

        setAllSkills(skillsRes || []);

        const levelsMap: Record<string, number> = {};
        if (userRes.skills) {
          userRes.skills.forEach((s) => {
            levelsMap[s.skillId] = s.level;
          });
        }
        setUserSkillLevels(levelsMap);
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        setError(apiErr.message || 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, userId]);

  const handleLevelChange = (skillId: string, level: number) => {
    setUserSkillLevels((prev) => {
      const next = { ...prev };
      if (level <= 0) {
        delete next[skillId];
      } else {
        next[skillId] = level;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      setError(null);

      const payload = Object.entries(userSkillLevels).map(([skillId, level]) => ({
        skillId,
        level,
      }));

      await apiClient.put(`/api/users/${userId}/skills`, payload);

      addToast({
        type: 'success',
        message: `Skills updated for ${userName}`,
      });
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to update skills');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Skill Competencies — ${userName}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Assign skill proficiencies (L1 to L3) used by the Smart Routing engine to match incidents.
        </p>
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading skill catalog...</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {allSkills.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No skills registered yet.</p>
            ) : (
              allSkills.map((skill) => {
                const currentLevel = userSkillLevels[skill.id] || 0;
                return (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between p-2.5 rounded bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-medium text-gray-200 block">{skill.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {currentLevel === 0
                          ? 'Not assigned'
                          : currentLevel === 1
                          ? 'L1 - Junior Associate'
                          : currentLevel === 2
                          ? 'L2 - Intermediate Analyst'
                          : 'L3 - Senior SOC Specialist'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleLevelChange(skill.id, lvl)}
                          className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
                            currentLevel === lvl
                              ? lvl === 0
                                ? 'bg-gray-800 text-gray-300 border-gray-600'
                                : lvl === 1
                                ? 'bg-blue-900 text-blue-200 border-blue-600'
                                : lvl === 2
                                ? 'bg-amber-900 text-amber-200 border-amber-600'
                                : 'bg-emerald-900 text-emerald-200 border-emerald-600'
                              : 'bg-gray-950 text-gray-500 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {lvl === 0 ? 'None' : `L${lvl}`}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save Competencies
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default SkillEditor;
