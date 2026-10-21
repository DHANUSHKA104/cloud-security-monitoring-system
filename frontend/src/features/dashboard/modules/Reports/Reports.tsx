import React from 'react';

export const ReportsCard: React.FC = () => {
  return (
    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 text-center">
      <h4 className="text-xs font-semibold text-gray-300">Automated Compliance Reports</h4>
      <p className="text-[11px] text-gray-500 mt-1">
        PDF/CSV report generation arrives in upcoming Module 13.
      </p>
    </div>
  );
};
export default ReportsCard;
