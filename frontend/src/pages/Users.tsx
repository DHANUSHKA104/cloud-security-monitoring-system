import React, { useState } from 'react';
import { UserList, TeamList, ShiftCalendar } from '@/features/user-management';

export const Users: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'shifts'>('users');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-100">User & Team Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage analysts, security teams, skill competencies and 24/7 rotating shifts
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-md border border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Users & Roles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'teams'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Teams
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shifts')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'shifts'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Shifts
          </button>
        </div>
      </div>

      {activeTab === 'users' && <UserList />}
      {activeTab === 'teams' && <TeamList />}
      {activeTab === 'shifts' && <ShiftCalendar />}
    </div>
  );
};
export default Users;
