import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Users } from '@/pages/Users';
import { apiClient } from '@/services/api/apiClient';

vi.mock('@/services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('User & Team Management Integration', () => {
  const mockUser = {
    id: 'u-1',
    fullName: 'Alice Analyst',
    email: 'alice@cloudsec.local',
    department: 'SOC Tier 2',
    role: 'ANALYST',
    active: true,
    mfaEnabled: false,
    skills: [{ skillId: 's-1', skillName: 'AWS Security', level: 3 }],
    teams: [{ teamId: 't-1', teamName: 'Cloud IR Squad', teamRole: 'LEAD' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (apiClient.get as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/u-1')) {
        return Promise.resolve(mockUser);
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          content: [mockUser],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        });
      }
      if (url.includes('/api/teams') && url.includes('/members')) {
        return Promise.resolve([
          {
            userId: 'u-1',
            fullName: 'Alice Analyst',
            email: 'alice@cloudsec.local',
            teamRole: 'LEAD',
          },
        ]);
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve([
          {
            id: 't-1',
            name: 'Cloud IR Squad',
            description: 'Incident response squad',
            leadName: 'Alice Analyst',
            leadId: 'u-1',
            memberCount: 1,
          },
        ]);
      }
      if (url.includes('/api/skills')) {
        return Promise.resolve([
          { id: 's-1', name: 'AWS Security' },
          { id: 's-2', name: 'Kubernetes' },
        ]);
      }
      if (url.includes('/api/shifts')) {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    });
  });

  it('1. User Management page is visible and renders tabs with user records', async () => {
    render(<Users />);

    expect(screen.getByText('User & Team Management')).toBeInTheDocument();
    expect(screen.getByText('Users & Roles')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Shifts')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Analyst')).toBeInTheDocument();
      expect(screen.getByText('alice@cloudsec.local')).toBeInTheDocument();
    });
  });

  it('2. Create User button opens UserForm in create mode with temporary password', async () => {
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Alice Analyst')).toBeInTheDocument();
    });

    const addUserBtn = screen.getByText('+ Add User');
    fireEvent.click(addUserBtn);

    expect(screen.getByText('Register Team Member')).toBeInTheDocument();
    expect(screen.getByTestId('user-form')).toBeInTheDocument();
    expect(screen.getByLabelText('Temporary Password')).toBeInTheDocument();
  });

  it('3. Edit User opens UserForm in edit mode without password field', async () => {
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    await waitFor(() => {
      expect(screen.getByText(/Edit Profile/i)).toBeInTheDocument();
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
      expect(screen.queryByLabelText('Temporary Password')).not.toBeInTheDocument();
    });
  });

  it('4. Clicking a user displays their profile modal (UserDetails)', async () => {
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Alice Analyst')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Alice Analyst'));

    await waitFor(() => {
      expect(screen.getByTestId('user-details-modal')).toBeInTheDocument();
      expect(screen.getByText(/Senior SOC Specialist/i)).toBeInTheDocument();
    });
  });

  it('5. Skills management opens SkillEditor with competencies catalog', async () => {
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Skills'));

    await waitFor(() => {
      expect(screen.getByText('Skill Competencies — Alice Analyst')).toBeInTheDocument();
      expect(screen.getByText('Save Competencies')).toBeInTheDocument();
    });
  });

  it('6. Teams tab displays existing teams, members, and Create Team opens TeamForm', async () => {
    render(<Users />);

    // Click Teams tab
    const teamsTab = screen.getByText('Teams');
    fireEvent.click(teamsTab);

    expect(screen.getByText('Security Operations Teams')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Cloud IR Squad').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Incident response squad/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Demote to Member')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });

    // Click "+ New Team"
    const newTeamBtn = screen.getByText('+ New Team');
    fireEvent.click(newTeamBtn);

    expect(screen.getByText('Form New Security Team')).toBeInTheDocument();
    expect(screen.getByTestId('team-form')).toBeInTheDocument();
    expect(screen.getByLabelText('Team Name')).toBeInTheDocument();
  });
});
