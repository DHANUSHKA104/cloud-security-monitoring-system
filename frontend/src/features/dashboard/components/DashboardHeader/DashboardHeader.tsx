import React from 'react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { getRoleGreeting } from '@/utils/helpers/greetingHelper';

interface DashboardHeaderProps {
  threatLevel?: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  lastUpdated?: Date;
  onRefresh?: () => void;
  loading?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  threatLevel = 'LOW',
  lastUpdated = new Date(),
  onRefresh,
  loading = false,
}) => {
  const { user } = useAuthStore();
  const greeting = getRoleGreeting(user?.fullName, user?.role);

  const threatColorMap = {
    LOW: {
      badge: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
      dot: 'bg-emerald-400',
      label: 'DEFENSE NORMAL · FORTIFIED',
    },
    ELEVATED: {
      badge: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
      dot: 'bg-amber-400',
      label: 'DEFENSE ELEVATED · MONITORING',
    },
    HIGH: {
      badge: 'border-orange-500/40 bg-orange-950/40 text-orange-300',
      dot: 'bg-orange-400',
      label: 'DEFENSE HIGH · ESCALATED',
    },
    CRITICAL: {
      badge: 'border-red-500/40 bg-red-950/40 text-red-300',
      dot: 'bg-red-400',
      label: 'DEFENSE CRITICAL · ACTIVE ENGAGEMENT',
    },
  };

  const currentThreat = threatColorMap[threatLevel] || threatColorMap.LOW;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#130f24]/95 via-[#1a1435]/90 to-[#0e0b1d]/95 border border-purple-500/25 p-6 sm:p-7 shadow-2xl shadow-purple-950/40 backdrop-blur-xl">
      {/* Twilight atmospheric ambient glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-16 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Column: Role Salutation & Mission Briefing */}
        <div className="space-y-3 max-w-2xl">
          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Role Badge */}
            <span
              className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold border ${greeting.badgeColor}`}
            >
              {greeting.badge}
            </span>

            {/* Threat Level Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-medium border ${currentThreat.badge}`}
            >
              <span className="flex h-2 w-2 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentThreat.dot} opacity-75`}
                />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${currentThreat.dot}`} />
              </span>
              {currentThreat.label}
            </span>
          </div>

          {/* Salutation Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-purple-100 to-purple-300">
            {greeting.salutation}
          </h1>

          {/* Role Headline */}
          <p className="text-sm sm:text-base font-medium text-purple-200/90 leading-snug">
            {greeting.headline}
          </p>

          {/* Role Subtext Description */}
          <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed">
            {greeting.subtext}
          </p>
        </div>

        {/* Right Column: Serene Wisdom Quote & Operations Controls */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0">
          {/* Quote Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 backdrop-blur-md max-w-sm">
            <div className="flex items-center gap-1.5 text-purple-300 text-xs font-mono mb-1.5">
              <span className="text-sm">🌸</span>
              <span className="uppercase tracking-wider text-[10px] text-purple-400/90 font-semibold">
                SOC Harmony & Resilience
              </span>
            </div>
            <p className="text-xs italic font-serif text-purple-100/80 leading-relaxed">
              {greeting.quote}
            </p>
          </div>

          {/* Quick Refresh & Last Updated Controls */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-gray-400">SOC Telemetry Time</div>
              <div className="text-xs font-mono text-purple-300">
                {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={loading}
              onClick={onRefresh}
              className="bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 border border-purple-700/50 hover:border-purple-500 transition-all shadow-md shadow-purple-950/30"
            >
              <svg
                className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Feed
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
