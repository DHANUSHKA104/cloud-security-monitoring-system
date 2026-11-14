import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.constants';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0c0919] text-gray-100 flex flex-col lg:flex-row relative overflow-hidden font-sans">
      {/* LEFT COLUMN: Serene Twilight Mountains & Lotus Artwork with Headings on Top & Greetings in the Middle */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/images/auth-bg-twilight.jpg')" }}
      >
        {/* Subtle, soft gradient overlays so the artwork remains vibrant while ensuring text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0919]/60 via-transparent to-[#0c0919]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0919]/70 via-transparent to-[#0c0919]/50 pointer-events-none" />

        {/* 1. TOP: Brand Logo & Title */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-800 p-0.5 shadow-xl shadow-purple-950/70 flex items-center justify-center border border-purple-400/40">
              <svg className="w-5 h-5 text-amber-300 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.32v4.59c0 4.14-2.73 8.01-6 9.09-3.27-1.08-6-4.95-6-9.09V6.5l6-2.32z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-xl tracking-wide text-white drop-shadow">
                CloudSec
              </span>
              <span className="text-[10px] block font-mono text-purple-300/90 -mt-0.5 uppercase tracking-widest drop-shadow">
                Monitor Console
              </span>
            </div>
          </Link>

          <span className="px-3 py-1 rounded-full bg-[#0c0919]/60 border border-purple-500/30 text-[11px] font-mono text-purple-200 backdrop-blur-md shadow-sm">
            Enterprise SOC v1.1
          </span>
        </div>

        {/* 2. MIDDLE: Pleasant, Elegant Greetings & Value Pillars directly on the image */}
        <div className="relative z-10 my-auto py-8 max-w-lg space-y-6">
          {/* Status Beacon */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c0919]/70 border border-emerald-500/30 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-semibold">
              Perimeters Active & Fortified
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2.5">
            <h2 className="text-3xl xl:text-4xl font-bold font-serif text-white tracking-tight drop-shadow-lg leading-tight">
              Build a safer digital environment.
            </h2>
            <p className="text-sm xl:text-base text-purple-100 font-light leading-relaxed drop-shadow">
              Where vigilant cloud defense meets serene clarity. Join CloudSec and be part of an intelligent defense system that protects what matters.
            </p>
          </div>

          {/* 3 Iconic Feature Highlights (Inspired by the Identity Management Mockup) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0c0919]/60 border border-purple-500/20 backdrop-blur-md shadow-lg transition-transform hover:translate-x-1">
              <div className="w-8 h-8 rounded-lg bg-purple-900/60 border border-purple-500/30 flex items-center justify-center shrink-0 text-base">
                🛡️
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Monitor Threats</h4>
                <p className="text-[11px] text-purple-200/80 font-light">
                  Detect, triage, and neutralize cloud vulnerabilities in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0c0919]/60 border border-purple-500/20 backdrop-blur-md shadow-lg transition-transform hover:translate-x-1">
              <div className="w-8 h-8 rounded-lg bg-sky-900/60 border border-sky-500/30 flex items-center justify-center shrink-0 text-base">
                🔒
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Secure Systems</h4>
                <p className="text-[11px] text-purple-200/80 font-light">
                  Keep your multi-cloud infrastructure resilient, compliant, and fortified.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0c0919]/60 border border-purple-500/20 backdrop-blur-md shadow-lg transition-transform hover:translate-x-1">
              <div className="w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-500/30 flex items-center justify-center shrink-0 text-base">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Smart 100-Point Routing</h4>
                <p className="text-[11px] text-purple-200/80 font-light">
                  Automated SLA enforcement, skill matching, and instant escalation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM: Trust Footnote & Serene Lotus Breathing Space */}
        <div className="relative z-10 flex items-center justify-between text-xs text-purple-200/70 pt-4 border-t border-purple-900/30">
          <span>Zero-Trust Architecture · SOC 2 Compliant</span>
          <span className="font-mono text-purple-300">99.99% Continuous SLA Uptime</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form (Login / Register) */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 z-10 shrink-0 bg-[#0c0919] border-l border-purple-900/30 shadow-2xl">
        {/* Mobile Header (visible only on mobile) */}
        <div className="lg:hidden space-y-2 mb-6">
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-800 p-0.5 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.32v4.59c0 4.14-2.73 8.01-6 9.09-3.27-1.08-6-4.95-6-9.09V6.5l6-2.32z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg text-white">CloudSec</span>
              <span className="text-[10px] block font-mono text-purple-400 uppercase">Monitor Console</span>
            </div>
          </Link>
          <p className="text-xs text-gray-400">
            Where vigilant cloud defense meets serene clarity. Fortified perimeter defense.
          </p>
        </div>

        {/* Form Container */}
        <div className="my-auto w-full max-w-md mx-auto py-2">
          <div className="rounded-2xl bg-[#110d22]/90 border border-purple-900/40 p-6 sm:p-8 shadow-2xl shadow-purple-950/50 backdrop-blur-xl">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-purple-900/20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2">
          <span>CloudSec SOC Incident Automation v1.1</span>
          <span className="font-mono text-purple-400/60">Simulated Environment</span>
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
