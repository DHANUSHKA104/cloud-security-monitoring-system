
import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.constants';

export type AuthTheme = 'dark' | 'light';

export interface AuthLayoutContext {
  theme: AuthTheme;
  toggleTheme: () => void;
}

export const AuthLayout: React.FC = () => {
  const [theme, setTheme] = useState<AuthTheme>('dark');

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme((current) => current === 'dark' ? 'light' : 'dark');
  };

  return (
    <div
      data-theme={theme}
      className={`min-h-screen flex flex-col lg:flex-row relative overflow-hidden font-sans transition-colors duration-500 ${
        isDark
          ? 'bg-[#050b20] text-white'
          : 'bg-[#f3f7ff] text-slate-900'
      }`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[130px] ${
          isDark ? 'bg-blue-600/15' : 'bg-blue-300/30'
        }`} />
        <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] ${
          isDark ? 'bg-violet-600/15' : 'bg-violet-300/25'
        }`} />
      </div>

      {/* LEFT SIDE */}
      <section className="relative flex-1 min-h-[650px] lg:min-h-screen flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-12 xl:px-16 overflow-hidden">

        {/* Decorative background lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-br from-blue-950/60 via-transparent to-violet-950/40'
              : 'bg-gradient-to-br from-blue-100 via-white to-violet-100'
          }`} />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to={ROUTES.LOGIN} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 p-[1px] shadow-lg shadow-blue-600/30">
              <div className="w-full h-full rounded-2xl flex items-center justify-center bg-[#101b3b]">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2 4 5v6c0 5 3.4 9.5 8 11 4.6-1.5 8-6 8-11V5l-8-3Z" />
                  <path d="M8.5 12.5 11 15l5-6" />
                </svg>
              </div>
            </div>

            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Cloud<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">Sec</span>
              </h1>
              <p className={`text-[10px] uppercase tracking-[0.22em] font-semibold ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}>
                Monitor · Defend · Secure
              </p>
            </div>
          </Link>

          <span className={`hidden sm:inline-flex text-xs font-mono px-3 py-1.5 rounded-full border ${
            isDark
              ? 'border-blue-400/20 bg-blue-950/40 text-blue-200'
              : 'border-blue-200 bg-white/70 text-blue-700'
          }`}>
            ENTERPRISE SOC v1.1
          </span>
        </div>

        {/* Hero */}
        <div className="relative z-10 max-w-3xl mx-auto lg:mx-0 w-full py-12">

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold tracking-wide mb-7 ${
            isDark
              ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SECURE. INTELLIGENT. ALWAYS ON.
          </div>

          <div className="flex flex-col xl:flex-row items-center xl:items-center gap-5 xl:gap-2">
            <div className="flex-1">
              <h2 className={`text-4xl sm:text-5xl xl:text-[58px] leading-[1.12] font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Build a safer
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400">
                  digital
                </span>
                environment.
              </h2>

              <p className={`mt-6 max-w-xl text-base sm:text-lg leading-relaxed ${
                isDark ? 'text-blue-100/75' : 'text-slate-600'
              }`}>
                Where vigilant cloud defense meets serene clarity.
                Join CloudSec and be part of an intelligent defense
                system that protects what matters.
              </p>
            </div>

            {/* Security Shield Illustration */}
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 shrink-0 flex items-center justify-center">
              <div className="absolute inset-5 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute inset-3 rounded-full border border-blue-400/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-violet-400/20 scale-75" />

              <div className="relative w-36 h-40 sm:w-44 sm:h-48 bg-gradient-to-br from-cyan-400 via-blue-600 to-violet-700 p-[2px] rounded-[45%_45%_50%_50%] shadow-[0_0_50px_rgba(59,130,246,0.4)]">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#10275c] to-[#10103b] rounded-[45%_45%_50%_50%]">
                  <svg viewBox="0 0 100 110" className="w-24 h-28 sm:w-28 sm:h-32" fill="none">
                    <path d="M50 5 90 20v30c0 27-17 45-40 55C27 95 10 77 10 50V20L50 5Z"
                      fill="url(#shieldGradient)" stroke="#67e8f9" strokeWidth="2" />
                    <path d="M50 17 79 28v23c0 20-12 34-29 43C33 85 21 71 21 51V28L50 17Z"
                      stroke="#93c5fd" strokeWidth="1.5" />
                    <rect x="34" y="47" width="32" height="27" rx="6" fill="#67e8f9" />
                    <path d="M40 47v-7a10 10 0 0 1 20 0v7" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
                    <circle cx="50" cy="59" r="3" fill="#1e3a8a" />
                    <path d="M50 62v5" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="shieldGradient" x1="10" y1="5" x2="90" y2="105" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#2563eb" stopOpacity=".9" />
                        <stop offset="1" stopColor="#7c3aed" stopOpacity=".8" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10">
            {[
              {
                icon: '🛡️',
                title: 'Monitor Threats',
                description: 'Detect, triage, and neutralize cloud vulnerabilities in real time.',
                color: 'from-violet-500 to-blue-500',
              },
              {
                icon: '✣',
                title: 'Secure Systems',
                description: 'Keep your infrastructure resilient, compliant, and fortified.',
                color: 'from-cyan-400 to-blue-500',
              },
              {
                icon: '⚡',
                title: 'Smart Routing',
                description: 'Automated SLA enforcement and instant escalation.',
                color: 'from-violet-500 to-pink-500',
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`group rounded-2xl p-4 border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 hover:border-blue-400/40 hover:bg-white/[0.07]'
                    : 'bg-white/75 border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${item.color} shadow-lg mb-3`}>
                  {item.icon}
                </div>
                <h3 className={`font-semibold text-sm mb-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {item.title}
                </h3>
                <p className={`text-xs leading-relaxed ${
                  isDark ? 'text-blue-100/60' : 'text-slate-600'
                }`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Left Footer */}
        <div className={`relative z-10 flex flex-wrap justify-between gap-2 pt-5 border-t text-[11px] ${
          isDark
            ? 'border-white/10 text-blue-200/50'
            : 'border-blue-200 text-slate-500'
        }`}>
          <span>CloudSec · Zero-Trust Architecture · SOC 2</span>
          <span className="font-mono">99.99% Continuous SLA Uptime</span>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className={`relative z-10 w-full lg:w-[480px] xl:w-[550px] min-h-screen flex flex-col justify-between px-5 py-7 sm:px-10 lg:px-12 border-l transition-colors duration-500 ${
        isDark
          ? 'bg-[#080e24]/95 border-white/10'
          : 'bg-white/80 border-blue-100'
      }`}>

        {/* Top controls */}
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Link to={ROUTES.LOGIN} className={`font-bold text-xl ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Cloud<span className="text-blue-500">Sec</span>
            </Link>
          </div>

          <div className="hidden lg:block" />

          {/* Working theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            aria-pressed={!isDark}
            className={`ml-auto flex items-center gap-3 rounded-full px-3 py-2 border transition-all duration-300 ${
              isDark
                ? 'bg-white/5 border-white/15 hover:bg-white/10'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <svg viewBox="0 0 24 24" className={`w-5 h-5 ${
              isDark ? 'text-slate-500' : 'text-amber-500'
            }`} fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>

            <span className={`relative w-12 h-6 rounded-full transition-colors ${
              isDark ? 'bg-violet-600' : 'bg-blue-500'
            }`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300 ${
                isDark ? 'left-[26px]' : 'left-0.5'
              }`}>
                {isDark ? (
                  <span className="text-violet-700 text-xs">☾</span>
                ) : (
                  <span className="text-amber-500 text-xs">☀</span>
                )}
              </span>
            </span>

            <svg viewBox="0 0 24 24" className={`w-5 h-5 ${
              isDark ? 'text-violet-300' : 'text-slate-400'
            }`} fill="currentColor">
              <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5Z" />
            </svg>
          </button>
        </div>

        {/* Authentication card */}
        <div className="my-auto w-full max-w-md mx-auto py-8">
          <div className={`rounded-[28px] p-6 sm:p-9 border backdrop-blur-2xl transition-all duration-500 ${
            isDark
              ? 'bg-gradient-to-br from-[#14244b]/90 to-[#0b1430]/95 border-blue-400/25 shadow-[0_20px_80px_rgba(37,99,235,0.15)]'
              : 'bg-white/90 border-blue-100 shadow-[0_20px_80px_rgba(37,99,235,0.10)]'
          }`}>
            <Outlet context={{ theme, toggleTheme } satisfies AuthLayoutContext} />
          </div>
        </div>

        {/* Right Footer */}
        <div className={`flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] border-t pt-5 ${
          isDark
            ? 'border-white/10 text-blue-200/40'
            : 'border-slate-200 text-slate-500'
        }`}>
          <span>CloudSec SOC Incident Automation v1.1</span>
          <span className="font-mono">Protected Environment</span>
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
