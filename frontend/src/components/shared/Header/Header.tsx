import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.constants';

interface HeaderProps {
  title?: string;
  threatLevel?: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
}

export const Header: React.FC<HeaderProps> = ({ title = 'Dashboard', threatLevel }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useAppStore();

  const threatBadgeClasses = {
    LOW: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    ELEVATED: 'bg-amber-950 text-amber-400 border-amber-800',
    HIGH: 'bg-orange-950 text-orange-400 border-orange-800',
    CRITICAL: 'bg-red-950 text-red-400 border-red-800 animate-pulse',
  };

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900/80 backdrop-blur-xs px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          aria-label="Toggle navigation sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-100">{title}</h1>
        {threatLevel && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border ${threatBadgeClasses[threatLevel]}`}
          >
            THREAT: {threatLevel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User menu */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
            <Link
              to={ROUTES.PROFILE}
              className="text-xs text-right hidden sm:block hover:underline"
            >
              <div className="font-medium text-gray-200">{user.fullName}</div>
              <div className="text-gray-400 text-[10px] uppercase font-mono">{user.role}</div>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-xs px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
