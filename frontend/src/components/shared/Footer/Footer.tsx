import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-10 border-t border-gray-800 bg-gray-950 px-4 flex items-center justify-between text-xs text-gray-500">
      <span>Cloud Security Monitoring System v1.1</span>
      <span className="text-amber-500/80 font-mono text-[11px]">
        Notice: Simulated data & statistical breach forecast
      </span>
    </footer>
  );
};
