import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/constants/routes.constants';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  const navItems = [
    {
      label: 'Dashboard',
      path: ROUTES.DASHBOARD,
      roles: ['ADMIN', 'ANALYST', 'VIEWER'],
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Incidents',
      path: ROUTES.INCIDENTS,
      roles: ['ADMIN', 'ANALYST', 'VIEWER'],
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'SLA & Workflows',
      path: ROUTES.WORKFLOWS,
      roles: ['ADMIN', 'ANALYST', 'VIEWER'],
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'User Management',
      path: ROUTES.USERS,
      roles: ['ADMIN'], // Admin only
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'My Profile',
      path: ROUTES.PROFILE,
      roles: ['ADMIN', 'ANALYST', 'VIEWER'],
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity ${
          sidebarCollapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarCollapsed(false)}
      />

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-60 bg-[#0b0916] border-r border-purple-900/25 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarCollapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-14 border-b border-purple-900/25 px-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-800 flex items-center justify-center shadow-md shadow-purple-950/50">
            <svg className="w-4 h-4 text-amber-300 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.32v4.59c0 4.14-2.73 8.01-6 9.09-3.27-1.08-6-4.95-6-9.09V6.5l6-2.32z" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-purple-300">
              CloudSec Monitor
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarCollapsed(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-200 font-semibold border-l-2 border-purple-400 shadow-sm shadow-purple-950/40'
                    : 'text-gray-400 hover:text-purple-200 hover:bg-purple-950/25 font-medium'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* System footer badge */}
        <div className="p-3 border-t border-purple-900/25 text-[11px] text-purple-400/60 font-mono text-center">
          SOC Automation v1.1
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
