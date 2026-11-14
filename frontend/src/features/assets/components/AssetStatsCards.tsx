import React from 'react';
import { AssetStats } from '../types/asset.types';

interface AssetStatsCardsProps {
  stats: AssetStats | null;
  loading: boolean;
}

export const AssetStatsCards: React.FC<AssetStatsCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-900/60 rounded-xl border border-purple-900/20 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Managed Assets',
      value: stats.totalAssets,
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      subtext: `${stats.activeAssets} actively monitored`,
      border: 'border-purple-500/30',
      bg: 'from-purple-950/40 to-gray-900/60',
    },
    {
      label: 'Critical Assets',
      value: stats.criticalAssets,
      icon: (
        <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      subtext: 'High-impact blast radius',
      border: 'border-rose-500/30',
      bg: 'from-rose-950/40 to-gray-900/60',
    },
    {
      label: 'AWS Cloud Resources',
      value: stats.byCloudProvider['AWS'] || 0,
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      subtext: `${stats.byType['STORAGE_BUCKET'] || 0} Buckets, ${stats.byType['API_GATEWAY'] || 0} Gateways`,
      border: 'border-amber-500/30',
      bg: 'from-amber-950/40 to-gray-900/60',
    },
    {
      label: 'Multi-Cloud & On-Prem',
      value: (stats.byCloudProvider['GCP'] || 0) + (stats.byCloudProvider['AZURE'] || 0) + (stats.byCloudProvider['ON_PREMISE'] || 0),
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      subtext: `${stats.byCloudProvider['GCP'] || 0} GCP | ${stats.byCloudProvider['AZURE'] || 0} Azure | ${stats.byCloudProvider['ON_PREMISE'] || 0} On-Prem`,
      border: 'border-cyan-500/30',
      bg: 'from-cyan-950/40 to-gray-900/60',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-xl border bg-gradient-to-br ${c.bg} ${c.border} shadow-lg shadow-black/40 flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{c.label}</span>
            <div className="p-2 rounded-lg bg-gray-900/60 border border-gray-800">{c.icon}</div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-100 font-mono">{c.value}</span>
            <p className="text-xs text-gray-400 mt-1">{c.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
