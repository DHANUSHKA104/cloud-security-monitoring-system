import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DashboardTrends } from '@/types/models.types';

interface ActivityChartProps {
  trends?: DashboardTrends;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ trends }) => {
  const [timeframe, setTimeframe] = useState<'hourly' | 'daily'>('daily');

  const rawData =
    timeframe === 'hourly' ? trends?.hourly || [] : trends?.daily || [];

  const chartData = rawData.map((d) => ({
    time: d.timestamp,
    incidents: d.count,
  }));

  return (
    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Incident Ingestion Trend</h3>
          <p className="text-[11px] text-gray-400">Security event frequency over time</p>
        </div>

        <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-md border border-gray-800">
          <button
            type="button"
            onClick={() => setTimeframe('hourly')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              timeframe === 'hourly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            24 Hours
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('daily')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              timeframe === 'daily'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            14 Days
          </button>
        </div>
      </div>

      <div className="h-56 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            No incident trend telemetry recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '0.375rem',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incidentGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
